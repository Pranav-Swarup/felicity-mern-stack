import { useState } from "react";
import { HiPlus, HiTrash, HiArrowUp, HiArrowDown } from "react-icons/hi";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File Upload" },
];

export default function FormBuilder({ fields, onChange }) {
  const addField = () => {
    onChange([
      ...fields,
      {
        fieldId: makeId(),
        label: "",
        type: "text",
        options: [],
        required: false,
        order: fields.length,
      },
    ]);
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const moveField = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((f, i) => (f.order = i));
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Custom Registration Form</h3>
        <button className="btn btn-sm btn-outline gap-1" onClick={addField}>
          <HiPlus size={14} /> Add Field
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm opacity-50 py-4 text-center">
          No custom fields yet. The form will only collect basic participant info.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, i) => (
          <div key={field.fieldId} className="card bg-base-200 p-4">
            <div className="flex gap-3 items-start">
              <div className="flex flex-col gap-1">
                <button className="btn btn-ghost btn-xs" onClick={() => moveField(i, -1)} disabled={i === 0}>
                  <HiArrowUp size={12} />
                </button>
                <button className="btn btn-ghost btn-xs" onClick={() => moveField(i, 1)} disabled={i === fields.length - 1}>
                  <HiArrowDown size={12} />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    placeholder="Field label"
                    value={field.label}
                    onChange={(e) => updateField(i, "label", e.target.value)}
                  />
                  <select
                    className="select select-bordered select-sm"
                    value={field.type}
                    onChange={(e) => updateField(i, "type", e.target.value)}
                  >
                    {fieldTypes.map((ft) => (
                      <option key={ft.value} value={ft.value}>{ft.label}</option>
                    ))}
                  </select>
                </div>

                {(field.type === "dropdown" || field.type === "checkbox") && (
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    placeholder="Options (comma separated)"
                    value={field.options?.join(", ") || ""}
                    onChange={(e) =>
                      updateField(i, "options", e.target.value.split(",").map((o) => o.trim()).filter(Boolean))
                    }
                  />
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={field.required}
                    onChange={(e) => updateField(i, "required", e.target.checked)}
                  />
                  <span className="text-sm">Required</span>
                </label>
              </div>

              <button className="btn btn-ghost btn-xs text-error" onClick={() => removeField(i)}>
                <HiTrash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
