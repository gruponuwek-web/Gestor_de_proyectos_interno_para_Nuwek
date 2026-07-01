import { useState, useEffect } from "react";
import { PROJECTS_INIT } from "../constants";
import { fetchProyectos, upsertProyecto, removeProyecto } from "../api/sheets";
import { localGet, localSet, KEYS, pendingAdd, pendingRemove, applyPending } from "../utils/storage";
import { normalizeDate } from "../utils/helpers";

export function useProjects() {
  const [projects, setProjects] = useState(PROJECTS_INIT);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProyectos();
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map(p => ({ ...p, startDate: normalizeDate(p.startDate), billingDate: normalizeDate(p.billingDate) }));
          const merged = applyPending("projects", normalized);
          setProjects(merged);
          localSet(KEYS.PROJECTS, merged);
        } else {
          // Sheets vacío → usar fallback local o PROJECTS_INIT
          const local = localGet(KEYS.PROJECTS);
          if (local) setProjects(local);
        }
      } catch (e) {
        setError(e.message);
        const local = localGet(KEYS.PROJECTS);
        if (local) setProjects(local);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProject = async (proj) => {
    const updated = projects.find(p => p.id === proj.id)
      ? projects.map(p => p.id === proj.id ? proj : p)
      : [...projects, proj];
    setProjects(updated);
    localSet(KEYS.PROJECTS, updated);
    pendingAdd("projects", proj.id, "upsert", proj);
    await upsertProyecto(proj);
    pendingRemove("projects", proj.id);
  };

  const deleteProject = async (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localSet(KEYS.PROJECTS, updated);
    pendingAdd("projects", id, "delete");
    await removeProyecto(id);
    pendingRemove("projects", id);
  };

  return { projects, loading, error, saveProject, deleteProject };
}