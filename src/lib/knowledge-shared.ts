/** Client-safe connector labels and ids (no env / Node imports). */
import {
  CONNECTOR_LABELS,
  SOURCE_CONNECTOR_IDS,
  connectorLabel,
  type SourceConnectorId,
} from "@relay/connectors/ids";

export {
  CONNECTOR_LABELS,
  SOURCE_CONNECTOR_IDS,
  connectorLabel,
  type SourceConnectorId,
};

export function listConnectorIds(): SourceConnectorId[] {
  return [...SOURCE_CONNECTOR_IDS];
}
