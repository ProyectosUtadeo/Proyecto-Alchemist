import type { ReactNode } from "react";
import "./FormRow.css";

type Props = {
  label: string;
  children: ReactNode;
};

export default function FormRow({ label, children }: Props) {
  return (
    <div className="form-row">
      <label className="form-row__label">{label}</label>
      <div className="form-row__control">{children}</div>
    </div>
  );
}