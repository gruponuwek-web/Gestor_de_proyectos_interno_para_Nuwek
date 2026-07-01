import { useState, useEffect } from "react";
import { PROJECTS_INIT } from "../constants";
import { fetchProyectos, upsertProyecto, removeProyecto } from "../api/sheets";
import { localGet, localSet, KEYS } from "../utils/storage";

export function useProjects() {
  const [projects, setProjects] = useState(PROJECTS_INIT);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProyectos();
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
          localSet(KEYS.PROJECTS, data);
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
    try { await upsertProyecto(proj); } catch {}
  };

  const deleteProject = async (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localSet(KEYS.PROJECTS, updated);
    try { await removeProyecto(id); } catch {}
  };

  return { projects, loading, error, saveProject, deleteProject };
}
