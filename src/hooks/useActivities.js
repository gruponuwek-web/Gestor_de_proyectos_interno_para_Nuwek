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

  const uncompleteOccurrence = async (id, date) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    await saveActivity({ ...act, completedDates: (act.completedDates || []).filter(d => d !== date) });
  };

  const updateStatus = async (id, newStatus) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    await saveActivity({ ...act, status: newStatus });
  };

  // Crea N registros individuales para una serie recurrente (nuevo modelo)
  const saveActivitiesBatch = async (acts) => {
    setActivities(prev => [...prev, ...acts]);
    const current = localGet(KEYS.ACTIVITIES) || [];
    localSet(KEYS.ACTIVITIES, [...current, ...acts]);
    for (const act of acts) {
      pendingAdd("activities", act.id, "upsert", act);
      await upsertActividad(act);
      pendingRemove("activities", act.id);
    }
  };

  // Elimina todas las ocurrencias de una serie por seriesId
  const deleteSeriesOccurrences = async (seriesId) => {
    const toDelete = activities.filter(a => a.seriesId === seriesId);
    const ids = new Set(toDelete.map(a => a.id));
    const updated = activities.filter(a => !ids.has(a.id));
    setActivities(updated);
    localSet(KEYS.ACTIVITIES, updated);
    for (const act of toDelete) {
      pendingAdd("activities", act.id, "delete");
      await removeActividad(act.id);
      pendingRemove("activities", act.id);
    }
  };

  return { activities, loading, error, saveActivity, saveActivitiesBatch, deleteActivity, deleteSeriesOccurrences, excludeOccurrence, completeOccurrence, uncompleteOccurrence, updateStatus };
}