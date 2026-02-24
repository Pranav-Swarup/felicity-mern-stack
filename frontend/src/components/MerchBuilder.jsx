import { HiPlus, HiTrash } from "react-icons/hi";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function MerchBuilder({ merchDetails, onChange }) {
  const { variants, purchaseLimitPerParticipant } = merchDetails;

  const addVariant = () => {
    onChange({
      ...merchDetails,
      variants: [
        ...variants,
        { variantId: makeId(), label: "", size: "", color: "", stock: 0 },
      ],
    });
  };

  const updateVariant = (index, key, value) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [key]: value };
    onChange({ ...merchDetails, variants: updated });
  };

  const removeVariant = (index) => {
    onChange({ ...merchDetails, variants: variants.filter((_, i) => i !== index) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Merchandise Variants</h3>
        <button className="btn btn-sm btn-outline gap-1" onClick={addVariant}>
          <HiPlus size={14} /> Add Variant
        </button>
      </div>

      <div className="form-control mb-4 max-w-xs">
        <label className="label"><span className="label-text">Purchase limit per participant</span></label>
        <input
          type="number"
          className="input input-bordered input-sm"
          min="1"
          value={purchaseLimitPerParticipant}
          onChange={(e) =>
            onChange({ ...merchDetails, purchaseLimitPerParticipant: parseInt(e.target.value) || 1 })
          }
        />
      </div>

      {variants.length === 0 && (
        <p className="text-sm opacity-50 py-4 text-center">
          No variants yet. Add sizes, colors, or item types.
        </p>
      )}

      <div className="space-y-3">
        {variants.map((v, i) => (
          <div key={v.variantId} className="card bg-base-200 p-4">
            <div className="flex gap-3 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="Label (e.g. Red / XL)"
                  value={v.label}
                  onChange={(e) => updateVariant(i, "label", e.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="Size"
                  value={v.size}
                  onChange={(e) => updateVariant(i, "size", e.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="Color"
                  value={v.color}
                  onChange={(e) => updateVariant(i, "color", e.target.value)}
                />
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  placeholder="Stock"
                  min="0"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, "stock", parseInt(e.target.value) || 0)}
                />
              </div>
              <button className="btn btn-ghost btn-xs text-error" onClick={() => removeVariant(i)}>
                <HiTrash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
