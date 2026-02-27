export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectIconOption  extends SelectOption {
  icon?: string;
  extra_label?: string;
}

