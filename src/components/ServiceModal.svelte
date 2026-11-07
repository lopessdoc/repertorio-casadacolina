<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { supabase } from '../lib/supabase';

  export let serviceToEdit: any = null;
  const dispatch = createEventDispatcher();

  let loading = false;
  let allSongs: any[] = [];
  let availableMinisters: any[] = [];
  let searchTerm = '';

  let dataCulto = new Date().toISOString().split('T')[0];
  let tipoCulto = 'Domingo';
  let observacoesCulto = '';

  let setlist: any[] = [];

  const tonsMaiores = ['C', 'C# / Db', 'D', 'D# / Eb', 'E', 'F', 'F# / Gb', 'G', 'G# / Ab', 'A', 'A# / Bb', 'B'];
  const tonsMenores = ['Cm', 'C#m / Dbm', 'Dm', 'D#m / Ebm', 'Em', 'Fm', 'F#m / Gbm', 'Gm', 'G#m / Abm', 'Am', 'A#m / Bbm', 'Bm'];
  const todosTons = [...tonsMaiores, ...tonsMenores];

  onMount(async () => {
    const { data: mData } = await supabase.from('app_musicas').select('id, titulo, artista, tom_original').order('titulo');
    if (mData) allSongs = mData;

    const { data: minData } = await supabase.from('app_ministros').select('id, nome').eq('ativo', true);
    if (minData) availableMinisters = minData;

    if (serviceToEdit) {
      dataCulto = serviceToEdit.data;
      tipoCulto = serviceToEdit.tipo;
      observacoesCulto = serviceToEdit.observacoes || '';
      
      setlist = (serviceToEdit.app_culto_musicas || []).map((exec: any) => ({
        musica_id: exec.app_musicas?.id,
        titulo: exec.app_musicas?.titulo,
        artista: exec.app_musicas?.artista,
        ministro_nome: exec.app_ministros?.nome || '',
        tom_cantado: exec.tom_cantado || '',
        arranjo: exec.arranjo || ''
      }));
    }
  });

  $: filteredSongs = allSongs.filter(s => 
    s.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.artista && s.artista.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  function addSongToSetlist(song: any) {
    setlist = [...setlist, {
      musica_id: song.id,
      titulo: song.titulo,
      artista: song.artista,
      ministro_nome: '', 
      tom_cantado: song.tom_original || '',
      arranjo: ''
    }];
    searchTerm = '';
  }

  function removeSongFromSetlist(index: number) {
    setlist = setlist.filter((_, i) => i !== index);
  }

  function moveSong(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index > 0) {
      const temp = setlist[index];
      setlist[index] = setlist[index - 1];
      setlist[index - 1] = temp;
      setlist = [...setlist];
    } else if (direction === 'down' && index < setlist.length - 1) {
      const temp = setlist[index];
      setlist[index] = setlist[index + 1];
      setlist[index + 1] = temp;
      setlist = [...setlist];
    }
  }

  async function saveService(e: Event) {
    e.preventDefault();
    if (setlist.length === 0) {
      alert("O setlist precisa ter pelo menos uma música.");
      return;
    }
    loading = true;

    try {
      const resolvedSetlist = await Promise.all(setlist.map(async (item, index) => {
        const minName = item.ministro_nome.trim();
        let minId = null;

        if (minName) {
          const existing = availableMinisters.find(m => m.nome.toLowerCase() === minName.toLowerCase());
          if (existing) {
            minId = existing.id;
          } else {
            const { data: newMin, error: errMin } = await supabase
              .from('app_ministros')
              .insert([{ nome: minName }])
              .select()
              .single();
            if (!errMin && newMin) {
              minId = newMin.id;
              availableMinisters.push(newMin);
            }
          }
        }

        return {
          musica_id: item.musica_id,
          ministro_id: minId,
          posicao: index + 1,
          tom_cantado: item.tom_cantado,
          arranjo: item.arranjo
        };
      }));

      let cultoId;

      if (serviceToEdit) {
        const { error: errCulto } = await supabase
          .from('app_cultos')
          .update({ data: dataCulto, tipo: tipoCulto, observacoes: observacoesCulto })
          .eq('id', serviceToEdit.id);
        
        if (errCulto) throw errCulto;
        cultoId = serviceToEdit.id;

        const { error: errDel } = await supabase
          .from('app_culto_musicas')
          .delete()
          .eq('culto_id', cultoId);
        
        if (errDel) throw errDel;
      } else {
        const { data: cultoData, error: errCulto } = await supabase
          .from('app_cultos')
          .insert([{ data: dataCulto, tipo: tipoCulto, observacoes: observacoesCulto }])
          .select()
          .single();
          
        if (errCulto) throw errCulto;
        cultoId = cultoData.id;
      }

      const execucoesData = resolvedSetlist.map(item => ({
        culto_id: cultoId,
        ...item
      }));

      const { error: errExec } = await supabase
        .from('app_culto_musicas')
        .insert(execucoesData);

      if (errExec) throw errExec;

      dispatch('save');
      closeModal();
    } catch (err: any) {
      alert("Erro ao salvar o culto: " + err.message);
    } finally {
      loading = false;
    }
  }

  function closeModal() {
    dispatch('close');
  }
</script>

<div class="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-colors duration-300">
  <div class="bg-white/95 dark:bg-brand-darkBg/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/10 max-w-2xl w-full p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto text-slate-900 dark:text-white flex flex-col transition-colors duration-300">
    
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10 shrink-0 transition-colors duration-300">
      <h3 class="text-base font-extrabold flex items-center gap-2">
        <i class="fa-solid fa-calendar-plus text-brand-accent"></i> 
        {serviceToEdit ? 'Editar Culto' : 'Registrar Culto'}
      </h3>
      <button type="button" on:click={closeModal} class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full transition">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>
    </div>

    <form on:submit={saveService} class="space-y-5 flex-1 overflow-y-auto no-scrollbar pr-1 pb-4">
      
      <!-- Dados do Culto -->
      <div class="bg-slate-50 dark:bg-brand-cardBg border border-slate-200 dark:border-white/10 rounded-2xl p-4 transition-colors duration-300">
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label for="dataCulto" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 transition-colors duration-300">Data</label>
            <input type="date" id="dataCulto" bind:value={dataCulto} required
                   class="w-full text-sm border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-accent transition-colors duration-300 dark:[color-scheme:dark]">
          </div>
          <div>
            <label for="tipoCulto" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 transition-colors duration-300">Tipo</label>
            <input type="text" id="tipoCulto" bind:value={tipoCulto} placeholder="Ex: Domingo Manhã" required
                   class="w-full text-sm border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-accent transition-colors duration-300">
          </div>
        </div>
        <div>
          <label for="obs" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 transition-colors duration-300">Observações (Opcional)</label>
          <textarea id="obs" bind:value={observacoesCulto} rows="1" placeholder="Ex: Ceia, Culto Especial..."
                    class="w-full text-sm border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-accent transition-colors duration-300"></textarea>
        </div>
      </div>

      <!-- Buscador de Músicas -->
      <div>
        <label for="search" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 transition-colors duration-300">Adicionar Música ao Setlist</label>
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400"></i>
          <input type="text" id="search" bind:value={searchTerm} placeholder="Digite o nome da música..." autocomplete="off"
                 class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-accent transition-colors duration-300">
          
          {#if searchTerm.length > 1}
            <div class="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto transition-colors duration-300">
              {#if filteredSongs.length === 0}
                <div class="p-3 text-xs text-slate-500 dark:text-slate-400">Nenhuma música encontrada.</div>
              {:else}
                {#each filteredSongs as song}
                  <button type="button" on:click={() => addSongToSetlist(song)} class="w-full text-left p-3 hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-white/5 last:border-0 text-sm transition">
                    <span class="font-bold text-slate-900 dark:text-white">{song.titulo}</span>
                    <span class="text-xs text-slate-500 dark:text-slate-400 ml-1">({song.artista})</span>
                  </button>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Setlist em Construção -->
      <div class="space-y-3">
        <h4 class="text-xs font-bold text-brand-accent uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-1 transition-colors duration-300">
          Setlist ({setlist.length})
        </h4>

        {#if setlist.length === 0}
          <div class="text-center py-6 border border-dashed border-slate-300 dark:border-white/20 rounded-xl text-slate-500 text-sm transition-colors duration-300">
            Busque uma música acima e toque para adicionar.
          </div>
        {/if}

        {#each setlist as item, idx}
          <div class="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-3 sm:p-4 rounded-2xl flex flex-col gap-3 relative group transition-colors duration-300">
            
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[10px] font-black bg-brand-accent/20 text-brand-accent px-1.5 py-0.5 rounded mr-1">{idx + 1}</span>
                <span class="font-bold text-sm text-slate-900 dark:text-white">{item.titulo}</span>
              </div>
              <div class="flex items-center gap-1">
                <button type="button" on:click={() => moveSong(idx, 'up')} disabled={idx === 0} class="w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded bg-slate-200 dark:bg-slate-900 transition"><i class="fa-solid fa-chevron-up text-xs"></i></button>
                <button type="button" on:click={() => moveSong(idx, 'down')} disabled={idx === setlist.length - 1} class="w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded bg-slate-200 dark:bg-slate-900 transition"><i class="fa-solid fa-chevron-down text-xs"></i></button>
                <button type="button" on:click={() => removeSongFromSetlist(idx)} class="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-950 rounded bg-slate-200 dark:bg-slate-900 ml-1 transition"><i class="fa-solid fa-xmark text-xs"></i></button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors duration-300">Ministro (Nome)</label>
                <input type="text" bind:value={item.ministro_nome} placeholder="Ex: Juliana" required
                       class="w-full text-xs border border-slate-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-accent transition-colors duration-300">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors duration-300">Tom Cantado</label>
                <select bind:value={item.tom_cantado} required
                        class="w-full text-xs border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-accent transition-colors duration-300">
                  <option value="">Selecione...</option>
                  {#each todosTons as tom}
                    <option value={tom}>{tom}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors duration-300">Arranjo (Opcional)</label>
              <input type="text" bind:value={item.arranjo} placeholder="Ex: Medley, Baixou 1 tom..."
                     class="w-full text-xs border border-slate-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-accent transition-colors duration-300">
            </div>
          </div>
        {/each}
      </div>

    </form>

    <div class="pt-4 mt-2 border-t border-slate-200 dark:border-white/10 flex justify-end gap-2 shrink-0 transition-colors duration-300">
      <button type="button" on:click={closeModal} class="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl font-semibold transition">Cancelar</button>
      <button type="button" on:click={saveService} disabled={loading || setlist.length === 0} class="px-5 py-2.5 text-xs bg-brand-accent hover:bg-[#6ab3a3] text-black font-extrabold rounded-xl shadow-lg shadow-brand-accent/20 active:scale-95 transition disabled:opacity-50">
        {loading ? 'Salvando...' : 'Salvar Culto'}
      </button>
    </div>
  </div>
</div>