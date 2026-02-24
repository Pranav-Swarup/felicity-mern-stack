import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/client";

export default function TicketModal({ ticketId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketId) return;
    api.get(`/registrations/ticket/${ticketId}`)
      .then(({ data }) => setData(data.registration))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (!ticketId) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box text-center">
        {loading ? (
          <span className="loading loading-spinner loading-lg"></span>
        ) : data ? (
          <>
            <h3 className="font-bold text-lg mb-1">{data.eventId?.name}</h3>
            <p className="text-sm opacity-60 mb-4">
              {data.eventId?.organizerId?.organizerName} • {data.eventId?.type}
            </p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={data.ticketId} size={180} />
            </div>
            <p className="font-mono text-lg font-bold">{data.ticketId}</p>
            <p className="text-xs opacity-50 mt-1">
              {data.eventId?.startDate
                ? new Date(data.eventId.startDate).toLocaleString()
                : "Date TBD"}
            </p>
            <p className="text-xs mt-1">
              Status: <span className="badge badge-sm badge-ghost">{data.status}</span>
            </p>
          </>
        ) : (
          <p className="opacity-50">Ticket not found</p>
        )}
        <div className="modal-action justify-center">
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
