import { registerGateway } from "./registry";
import cardGateway from "./gateways/card";
import paypalGateway from "./gateways/paypal";
import eftGateway from "./gateways/eft";
import ozowGateway from "./gateways/ozow";
import snapscanGateway from "./gateways/snapscan";

export function registerMocks() {
  registerGateway(cardGateway);
  registerGateway(paypalGateway);
  registerGateway(eftGateway);
  registerGateway(ozowGateway);
  registerGateway(snapscanGateway);
}
