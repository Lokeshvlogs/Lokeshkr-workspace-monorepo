export interface SelectOption {
  value: string;
  label: string;
  /**
   * Heading this option sits under, e.g. "Banking & Finance".
   *
   * A label, not an identity: dropdowns emit a header row when one option's
   * group differs from the one before it, so the array's own order decides
   * where a group starts and ends. Options without a group render flat, which
   * is every list that has not opted in.
   */
  group?: string;
}

export interface SelectIconOption  extends SelectOption {
  icon?: string;
  extra_label?: string;
}

