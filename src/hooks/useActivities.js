import { useState, useEffect } from "react";
import { fetchActividades, upsertActividad, removeActividad } from "../api/sheets";
import { localGet, localSet, KEYS } from "../utils/storage";
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
          const normalized = data.map(a => ({ ...a, date: normalizeDate(a.date), originalDate: normalizeDate(a.originalDate) }));
          setActivities(normalized);
          localSet(KEYS.ACTIVITIES, normalized);
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
    await upsertActividad(act);
  };

  const deleteActivity = async (id) => {
    const updated = activities.filter(a => a.id !== id);
    setActivities(updated);
    localSet(KEYS.ACTIVITIES, updated);
    await removeActividad(id);
  };

  const updateStatus = async (id, newStatus) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    await saveActivity({ ...act, status: newStatus });
  };

  return { activities, loading, error, saveActivity, deleteActivity, updateStatus };
}