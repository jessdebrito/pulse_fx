import { z } from 'zod';
import { CalendarDate } from '../../../shared/calendar-date';
import type { Indicator, IndicatorFrequency, IndicatorObservation } from '../../indicators';
import { BCB_SGS_BASE_URL, BCB_SGS_METADATA_URL, DECIMAL_TEXT_PATTERN } from '../sync.constants';
import { ExternalSourceError } from '../sync.errors';
import type { HttpClient } from './http-client';
import type { IndicatorSourceClient } from './indicator-source.client';

const NOT_FOUND_STATUS = 404;
const VALUES_NOT_FOUND_DETAIL = 'Value(s) not found';
const SOAP_HEADERS = Object.freeze({ 'content-type': 'text/xml; charset=utf-8', soapaction: '""' });
const SOAP_RETURN_PATTERN = /<getUltimoValorXMLReturn[^>]*>([^<]*)<\/getUltimoValorXMLReturn>/;
const XML_ENTITY_PATTERN = /&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g;
const HEXADECIMAL_RADIX = 16;
const DECIMAL_RADIX = 10;

const NAMED_XML_ENTITIES: Readonly<Record<string, string>> = Object.freeze({ lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" });

const FREQUENCY_BY_PERIODICITY: Readonly<Record<string, IndicatorFrequency>> = Object.freeze({
  D: 'daily',
  M: 'monthly',
  T: 'quarterly',
  A: 'annual',
});

const observationsSchema = z.array(
  z.object({
    data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
    valor: z.string().regex(DECIMAL_TEXT_PATTERN),
  }),
);

const valuesNotFoundSchema = z.object({
  erro: z.object({ statusCode: z.literal(NOT_FOUND_STATUS), detail: z.string().includes(VALUES_NOT_FOUND_DETAIL) }),
});

interface SgsMetadata {
  readonly name: string;
  readonly unit: string;
  readonly periodicity: string;
}

export class BcbSgsClient implements IndicatorSourceClient {
  constructor(
    private readonly http: HttpClient,
    private readonly baseUrl: string = BCB_SGS_BASE_URL,
    private readonly metadataUrl: string = BCB_SGS_METADATA_URL,
  ) {}

  async fetchIndicator(code: string): Promise<Indicator> {
    const response = await this.http.postText(this.metadataUrl, latestValueRequest(code), SOAP_HEADERS);
    const metadata = parseMetadata(response, code);
    return { source: 'sgs', code, name: metadata.name, unit: metadata.unit, frequency: toFrequency(metadata.periodicity, code) };
  }

  async fetchObservations(code: string, from: CalendarDate, to: CalendarDate): Promise<IndicatorObservation[]> {
    const query = new URLSearchParams({ formato: 'json', dataInicial: toSgsDate(from), dataFinal: toSgsDate(to) });
    const url = `${this.baseUrl}/bcdata.sgs.${code}/dados?${query.toString()}`;
    const payload = await this.http.getJson(url, { acceptedStatuses: [NOT_FOUND_STATUS] });
    if (valuesNotFoundSchema.safeParse(payload).success) return [];
    const parsed = observationsSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ExternalSourceError(`Unexpected SGS series ${code} observations payload: ${z.prettifyError(parsed.error)}`);
    }
    return parsed.data.map((item) => ({ date: fromSgsDate(item.data), value: item.valor }));
  }
}

function latestValueRequest(code: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pub="http://publico.ws.casosdeuso.sgs.pec.bcb.gov.br">',
    `<soapenv:Body><pub:getUltimoValorXML><in0>${code}</in0></pub:getUltimoValorXML></soapenv:Body>`,
    '</soapenv:Envelope>',
  ].join('');
}

function parseMetadata(soapResponse: string, code: string): SgsMetadata {
  const escapedSeries = SOAP_RETURN_PATTERN.exec(soapResponse)?.[1];
  if (escapedSeries === undefined) throw new ExternalSourceError(`Unexpected SGS metadata payload for series ${code}`);
  const series = decodeXmlEntities(escapedSeries);
  return {
    name: requiredElement(series, 'NOME', code),
    unit: requiredElement(series, 'UNIDADE', code),
    periodicity: requiredElement(series, 'PERIODICIDADE', code),
  };
}

function requiredElement(xml: string, tag: string, code: string): string {
  const value = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml)?.[1]?.trim();
  if (value === undefined || value === '') throw new ExternalSourceError(`SGS metadata of series ${code} has no ${tag}`);
  return decodeXmlEntities(value);
}

function decodeXmlEntities(text: string): string {
  return text.replace(XML_ENTITY_PATTERN, (_entity, reference: string) => {
    if (reference.startsWith('#x')) return String.fromCodePoint(Number.parseInt(reference.slice(2), HEXADECIMAL_RADIX));
    if (reference.startsWith('#')) return String.fromCodePoint(Number.parseInt(reference.slice(1), DECIMAL_RADIX));
    return NAMED_XML_ENTITIES[reference] ?? '';
  });
}

function toFrequency(periodicity: string, code: string): IndicatorFrequency {
  const frequency = FREQUENCY_BY_PERIODICITY[periodicity];
  if (frequency === undefined) throw new ExternalSourceError(`Unsupported SGS periodicity '${periodicity}' for series ${code}`);
  return frequency;
}

function toSgsDate(date: CalendarDate): string {
  const [year, month, day] = date.toString().split('-');
  return `${day}/${month}/${year}`;
}

function fromSgsDate(sgsDate: string): CalendarDate {
  const [day, month, year] = sgsDate.split('/');
  return CalendarDate.fromIso(`${year}-${month}-${day}`);
}
