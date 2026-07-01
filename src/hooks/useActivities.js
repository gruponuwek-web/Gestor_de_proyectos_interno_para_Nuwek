import { useState, useEffect } from "react";
import { fetchActividades, upsertActividad, removeActividad } from "../api/sheets";
import { localGet, localSet, KEYS, pendingAdd, pendingRemove, applyPending } from "../utils/storage";
import { normalizeDate } from "../utils/helpers";

export function useActivities() {
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchActividades();
        if (Array.isArray(data)) {
          const normalizeTime = v => !v ? "" : v.includes("T") ? new Date(v).toISOString().slice(11,16) : v.slice(0,5);
          const normalized = data.map(a => ({ ...a, date: normalizeDate(a.date), originalDate: normalizeDate(a.originalDate), timeStart: normalizeTime(a.timeStart), timeEnd: normalizeTime(a.timeEnd) }));
          // Aplica cambios locales no confirmados encima de los datos de Sheets
          const merged = applyPending("activities", normalized);
          setActivities(merged);
          localSet(KEYS.ACTIVITIES, merged);
        }
      } catch (e) {
        setError(e.message);
        const local = localGet(KEYS.ACTIVITIES);
        if (local) setActivities(local);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveActivity = async (act) => {
    const updated = activities.find(a => a.id === act.id)
      ? activities.map(a => a.id === act.id ? act : a)
      : [...activities, act];
    setActivities(updated);
    localSet(KEYS.ACTIVITIES, updated);
    pendingAdd("activities", act.id, "upsert", act);
    await upsertActividad(act);
    pendingRemove("activities", act.id);
  };

  const deleteActivity = async (id) => {
    const updated = activities.filter(a => a.id !== id);
    setActivities(updated);
    localSet(KEYS.ACTIVITIES, updated);
    pendingAdd("activities", id, "delete");
    await removeActividad(id);
    pendingRemove("activities", id);
  };

  const excludeOccurrence = async (id, date) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    await saveActivity({ ...act, excludeDates: [...(act.excludeDates || []), date] });
  };

  const completeOccurrence = async (id, date) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    await saveActivity({ ...act, completedDates: [...(act.completedDates || []), date] });
  };

  const updateStatus = async (id, newStatus) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    await saveActivity({ ...act, status: newStatus });
  };

  return { activities, loading, error, saveActivity, deleteActivity, excludeOccurrence, completeOccurrence, updateStatus };
}