import { Appointment } from "../models.js";
export async function predictNoShowRisk(patientId, date, timeSlot) {
  const history = await Appointment.find({
    patientId,
    status: { $in: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
  })
    .sort({ date: -1 })
    .limit(10)
    .select("status");
  const misses = history.filter((x) => x.status === "NO_SHOW" || x.status === "CANCELLED").length;
  const historyRate = history.length ? misses / history.length : 0;
  const lateSlot = Number(timeSlot.slice(0, 2)) >= 16 ? 0.12 : 0;
  const sameDay = date === new Date().toISOString().slice(0, 10) ? 0.1 : 0;
  const score = Math.min(1, Math.round((historyRate * 0.78 + lateSlot + sameDay) * 100) / 100);
  return {
    score,
    label: score >= 0.5 ? "HIGH" : score >= 0.25 ? "MEDIUM" : "LOW",
    basis: history.length
      ? "recent attendance history and slot timing"
      : "limited attendance history",
  };
}
