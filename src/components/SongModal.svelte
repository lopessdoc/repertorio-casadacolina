<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { supabase } from '../lib/supabase';

  export let songToEdit: any = null;
  const dispatch = createEventDispatcher();

  let loading = false;
  let ytHelper = "Cole a URL e clique em 'Puxar' para autocompletar.";
  
  let youtubeUrl = '';
  let youtube_id = '';
  let titulo = '';
  let artista = '';
  let estilo = '';
  let tom_original = '';
  let bpm: number | string = '';

  const tonsMaiores = ['C', 'C# / Db', 'D', 'D# / Eb', 'E', 'F', 'F# / Gb', 'G', 'G# / Ab', 'A', 'A# / Bb', 'B'];
  const tonsMenores = ['Cm', 'C#m / Dbm', 'Dm', 'D#m / Ebm', 'Em', 'Fm', 'F#m / Gbm', 'Gm', 'G#m / Abm', 'Am', 'A#m / Bbm', 'Bm'];

  onMount(() => {
    if (songToEdit) {
      titulo = songToEdit.titulo || '';
      artista = songToEdit.artista || '';
      estilo = songToEdit.estilo || '';
      tom_original = songToEdit.tom_original || '';
      bpm = songToEdit.bpm || '';
      youtube_id = songToEdit.youtube_id || '';
      if (youtube_id) youtubeUrl = `https://www.youtube.com/watch?v=${youtube_id}`;
      ytHelper = "Altere os campos necessários e clique em Salvar.";
    }
  });

  function extractYouTubeId(url: string) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  }

  async function fetchYouTubeData() {
    if (!youtubeUrl) {
      ytHelper = "Por favor, insira a URL primeiro.";
      return;
    }

    youtube_id = extractYouTubeId(youtubeUrl);
    ytHelper = "Consultando dados do vídeo...";

    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(youtubeUrl)}`);
      const data = await response.json();

      if (data.title) {
        let t = data.title;
        let a = data.author_name || '';

        if (t.includes('-')) {
          const parts = t.split('-');
          a = parts[0].trim();
          t = parts.slice(1).join('-').trim();
        }

        titulo = t;
        artista = a;
        ytHelper = "Título, Artista e Miniatura carregados!";
      } else {
        ytHelper = "Vídeo localizado. Preencha os campos abaixo.";
      }
    } catch (err) {
      ytHelper = "Não foi possível carregar automaticamente. Insira os dados manualmente.";
    }
  }

  async function saveSong(e: Event) {
    e.preventDefault();
    loading = true;

    if (!youtube_id && youtubeUrl) {
      youtube_id = extractYouTubeId(youtubeUrl);
    }

    const songData = {
      titulo,
      artista,
      estilo,
      tom_original,
      bpm: bpm ? parseInt(bpm.toString()) : null,
      youtube_id
    };

    let error;

    if (songToEdit) {
      const res = await supabase.from('app_musicas').update(songData).eq('id', songToEdit.id);
      error = res.error;
    } else {
      const res = await supabase.from('app_musicas').insert([songData]);
      error = res.error;
    }

    loading = false;

    if (error) {
      alert('Erro ao salvar música: ' + error.message);
    } else {
      dispatch('save');
      closeModal();
    }
  }

  function closeModal() {
    dispatch('close');
  }
</script>

<div class="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-colors duration-300">
  <div class="bg-white/95 dark:bg-brand-darkBg/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/10 max-w-lg w-full p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto text-slate-900 dark:text-white transition-colors duration-300">
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10 transition-colors duration-300">
      <h3 class="text-base font-extrabold">{songToEdit ? 'Editar Música' : 'Cadastrar Nova Música'}</h3>
      <button on:click={closeModal} class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full transition">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>
    </div>

    <form on:submit={saveSong} class="space-y-4">
      <div>
        <label for="ytUrl" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 transition-colors duration-300">Link do YouTube</label>
        <div class="flex gap-2">
          <input type="url" id="ytUrl" bind:value={youtubeUrl} placeholder="https://www.youtube.com/watch?v=..." 
                 class="flex-1 text-sm border border-slate-300 dark:border-white/10 rounded-2xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-300" required>
          <button type="button" on:click={fetchYouTubeData} class="bg-brand-accent hover:bg-[#6ab3a3] text-black px-4 py-2.5 rounded-2xl text-xs font-extrabold transition shrink-0 active:scale-95 shadow-md shadow-brand-accent/10">
            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Puxar
          </button>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 transition-colors duration-300">{ytHelper}</p>
      </div>

      {#if youtube_id}
        <div class="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 relative bg-black aspect-video max-h-32 flex items-center justify-center shadow-inner transition-colors duration-300">
          <img src={`https://img.youtube.com/vi/${youtube_id}/mqdefault.jpg`} alt="Miniatura YouTube" class="w-full h-full object-cover">
        </div>
      {/if}

      <div>
        <label for="titulo" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 transition-colors duration-300">Título da Música</label>
        <input type="text" id="titulo" bind:value={titulo} required
               class="w-full text-sm border border-slate-300 dark:border-white/10 rounded-2xl px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors duration-300">
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label for="artista" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 transition-colors duration-300">Artista / Compositor</label>
          <input type="text" id="artista" bind:value={artista} required
                 class="w-full text-sm border border-slate-300 dark:border-white/10 rounded-2xl px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors duration-300">
        </div>
        <div>
          <label for="estilo" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 transition-colors duration-300">Estilo da Música</label>
          <select id="estilo" bind:value={estilo} required
                  class="w-full text-sm border border-slate-300 dark:border-white/10 rounded-2xl px-3 py-2 bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors duration-300">
            <option value="">Selecione...</option>
            <option value="Adoração / Exaltação">Adoração / Exaltação</option>
            <option value="Celebração / Júbilo">Celebração / Júbilo</option>
            <option value="Rendição / Devoção">Rendição / Devoção</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="tom_original" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 transition-colors duration-300">Tom Original</label>
          <select id="tom_original" bind:value={tom_original} required
                  class="w-full text-sm border border-slate-300 dark:border-white/10 rounded-2xl px-2 py-2 bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors duration-300">
            <option value="">Selecione...</option>
            <optgroup label="Maiores">
              {#each tonsMaiores as tom}
                <option value={tom}>{tom}</option>
              {/each}
            </optgroup>
            <optgroup label="Menores">
              {#each tonsMenores as tom}
                <option value={tom}>{tom}</option>
              {/each}
            </optgroup>
          </select>
        </div>
        <div>
          <label for="bpm" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 transition-colors duration-300">BPM</label>
          <input type="number" id="bpm" bind:value={bpm} placeholder="Ex: 72"
                 class="w-full text-sm border border-slate-300 dark:border-white/10 rounded-2xl px-3 py-2 bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors duration-300">
        </div>
      </div>

      <div class="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-2 transition-colors duration-300">
        <button type="button" on:click={closeModal} class="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl font-semibold transition">Cancelar</button>
        <button type="submit" disabled={loading} class="px-5 py-2.5 text-xs bg-brand-accent hover:bg-[#6ab3a3] text-black font-extrabold rounded-xl shadow-lg shadow-brand-accent/20 active:scale-95 transition disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar Música'}
        </button>
      </div>
    </form>
  </div>
</div>