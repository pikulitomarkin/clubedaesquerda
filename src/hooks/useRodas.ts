import { useState, useCallback } from 'react';
import type { Roda, Mesa, CreateRodaDTO, CreateMesaDTO } from '@/types/rodas';

interface UseRodasReturn {
  rodas: Roda[];
  selectedRoda: Roda | null;
  isLoading: boolean;
  error: string | null;
  createRoda: (data: CreateRodaDTO) => Promise<void>;
  addMesa: (mesa: Mesa) => Promise<void>;
  updateMesa: (mesaId: string, data: Partial<Mesa>) => Promise<void>;
  deleteMesa: (mesaId: string) => Promise<void>;
  deleteRoda: (rodaId: string) => Promise<void>;
  selectRoda: (roda: Roda | null) => void;
  loadRodas: (data: Roda[]) => void;
}

export const useRodas = (initialData: Roda[] = []): UseRodasReturn => {
  const [rodas, setRodas] = useState<Roda[]>(initialData);
  const [selectedRoda, setSelectedRoda] = useState<Roda | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoda = useCallback(async (data: CreateRodaDTO) => {
    setIsLoading(true);
    setError(null);

    try {
      const novaRoda: Roda = {
        id: `roda-${Date.now()}`,
        nome: data.nome,
        descricao: data.descricao,
        imagemCapa: data.imagemCapa,
        gifLoop: data.gifLoop,
        musicas: data.musicas,
        mesas: [],
        criadorId: 'user-current',
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        ativo: true,
        tags: data.tags,
        categoria: data.categoria,
        participantesCount: 1,
      };

      setRodas((prev) => [...prev, novaRoda]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar roda';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMesa = useCallback(
    async (mesa: Mesa) => {
      setIsLoading(true);
      setError(null);

      try {
        setRodas((prev) =>
          prev.map((roda) =>
            roda.id === mesa.rodaId
              ? { ...roda, mesas: [...roda.mesas, mesa] }
              : roda
          )
        );

        if (selectedRoda && selectedRoda.id === mesa.rodaId) {
          setSelectedRoda((prev) =>
            prev ? { ...prev, mesas: [...prev.mesas, mesa] } : null
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao adicionar mesa';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedRoda]
  );

  const updateMesa = useCallback(
    async (mesaId: string, data: Partial<Mesa>) => {
      setIsLoading(true);
      setError(null);

      try {
        setRodas((prev) =>
          prev.map((roda) => ({
            ...roda,
            mesas: roda.mesas.map((mesa) =>
              mesa.id === mesaId
                ? { ...mesa, ...data, atualizadoEm: new Date() }
                : mesa
            ),
          }))
        );

        if (selectedRoda) {
          setSelectedRoda((prev) =>
            prev
              ? {
                  ...prev,
                  mesas: prev.mesas.map((mesa) =>
                    mesa.id === mesaId
                      ? { ...mesa, ...data, atualizadoEm: new Date() }
                      : mesa
                  ),
                }
              : null
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar mesa';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedRoda]
  );

  const deleteMesa = useCallback(
    async (mesaId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        setRodas((prev) =>
          prev.map((roda) => ({
            ...roda,
            mesas: roda.mesas.filter((mesa) => mesa.id !== mesaId),
          }))
        );

        if (selectedRoda) {
          setSelectedRoda((prev) =>
            prev
              ? {
                  ...prev,
                  mesas: prev.mesas.filter((mesa) => mesa.id !== mesaId),
                }
              : null
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao deletar mesa';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedRoda]
  );

  const deleteRoda = useCallback(async (rodaId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      setRodas((prev) => prev.filter((roda) => roda.id !== rodaId));
      if (selectedRoda?.id === rodaId) {
        setSelectedRoda(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar roda';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoda]);

  const selectRoda = useCallback((roda: Roda | null) => {
    setSelectedRoda(roda);
  }, []);

  const loadRodas = useCallback((data: Roda[]) => {
    setRodas(data);
  }, []);

  return {
    rodas,
    selectedRoda,
    isLoading,
    error,
    createRoda,
    addMesa,
    updateMesa,
    deleteMesa,
    deleteRoda,
    selectRoda,
    loadRodas,
  };
};
