import React from "react";
import { Camera, Lightbulb } from "lucide-react";
import { getImageUrl } from "../services/api";

const EventsTable = ({ events, onImageClick }) => {
  return (
    <div className="lg:col-span-2 table-surface overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-white via-white to-[#fef2e8] flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 font-semibold">
            Live Feed
          </p>
          <h2 className="font-bold text-gray-800 text-lg">Real-time Events</h2>
        </div>
        <span className="text-xs text-gray-500">
          Updated every few seconds
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[11px]">
            <tr>
              <th className="p-3">Event</th>
              <th className="p-3">Time</th>
              <th className="p-3">Description</th>
              <th className="p-3">Count</th>
              <th className="p-3 hidden md:table-cell">Location</th>
              <th className="p-3 hidden md:table-cell">Distance</th>
              <th className="p-3 hidden lg:table-cell">LED</th>
              <th className="p-3 hidden lg:table-cell">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event) => (
              <tr
                key={event.id}
                className={`group transition-colors ${
                  event.isHazard ? "bg-red-50/60" : "hover:bg-slate-50"
                }`}
                title={event.description || "No description available"}
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        event.isHazard ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    ></span>
                    {event.imageUrl ? (
                      <Camera
                        size={20}
                        className="text-blue-500 cursor-pointer hover:text-blue-700"
                        title="Click to view image"
                        onClick={() => onImageClick(getImageUrl(event.imageUrl))}
                      />
                    ) : (
                      <Camera size={20} className="text-gray-300" />
                    )}
                  </div>
                </td>
                <td className="p-3 font-mono text-blue-600">{event.time}</td>
                <td className="p-3 font-medium">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        event.isHazard
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {event.description || event.type}
                    </span>
                    {event.reasons?.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {event.reasons.join(", ")}
                      </p>
                    )}
                  </div>
                </td>
                <td className="p-3 font-bold text-gray-800">
                  {event.objectsCount || 1}
                </td>
                <td className="p-3 text-gray-600 truncate max-w-[140px] hidden md:table-cell">
                  {event.location}
                </td>
                <td className="p-3 hidden md:table-cell">
                  <span
                    className={event.distance ? "text-gray-700" : "text-gray-400 italic"}
                  >
                    {event.distance || "N/A"}
                  </span>
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      event.ledActivated
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Lightbulb size={12} />
                    {event.ledActivated ? "ON" : "OFF"}
                  </span>
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      event.isHazard
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {event.isHazard ? "HAZARD" : "SAFE"}
                  </span>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500 text-sm" colSpan={8}>
                  No alerts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventsTable;
