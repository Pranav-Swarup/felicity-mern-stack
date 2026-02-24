export default function FormRenderer({ fields, values, onChange }) {
  if (!fields || fields.length === 0) return null;

  const handleChange = (fieldId, value) => {
    onChange({ ...values, [fieldId]: value });
  };

  return (
    <div className="space-y-3">
      {fields
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <div key={field.fieldId} className="form-control">
            <label className="label">
              <span className="label-text">
                {field.label}
                {field.required && <span className="text-error ml-1">*</span>}
              </span>
            </label>

            {field.type === "text" && (
              <input
                type="text"
                className="input input-bordered w-full"
                value={values[field.fieldId] || ""}
                onChange={(e) => handleChange(field.fieldId, e.target.value)}
                required={field.required}
              />
            )}

            {field.type === "textarea" && (
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                value={values[field.fieldId] || ""}
                onChange={(e) => handleChange(field.fieldId, e.target.value)}
                required={field.required}
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                className="input input-bordered w-full"
                value={values[field.fieldId] || ""}
                onChange={(e) => handleChange(field.fieldId, e.target.value)}
                required={field.required}
              />
            )}

            {field.type === "dropdown" && (
              <select
                className="select select-bordered w-full"
                value={values[field.fieldId] || ""}
                onChange={(e) => handleChange(field.fieldId, e.target.value)}
                required={field.required}
              >
                <option value="">Select...</option>
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === "checkbox" && (
              <div className="flex flex-wrap gap-3">
                {(field.options || []).map((opt) => {
                  const checked = (values[field.fieldId] || []).includes(opt);
                  return (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={checked}
                        onChange={(e) => {
                          const prev = values[field.fieldId] || [];
                          const next = e.target.checked
                            ? [...prev, opt]
                            : prev.filter((v) => v !== opt);
                          handleChange(field.fieldId, next);
                        }}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {field.type === "file" && (
              <input
                type="file"
                className="file-input file-input-bordered w-full"
                onChange={(e) => handleChange(field.fieldId, e.target.files[0]?.name || "")}
              />
            )}
          </div>
        ))}
    </div>
  );
}
