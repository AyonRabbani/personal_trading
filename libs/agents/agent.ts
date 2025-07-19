/**
 * Generic Agent interface.
 * Implementations react to events and emit trading signals.
 */
export interface Agent<Event, Signal> {
  /** Unique agent name */
  name: string;
  /** Process an incoming event */
  onEvent(evt: Event): Promise<void>;
  /** Retrieve generated signals */
  getSignals(): Promise<Signal[]>;
}
