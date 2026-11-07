<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { supabase } from '../lib/supabase';

  export let isAdmin = false;
  const dispatch = createEventDispatcher();

  let songs: any[] = [];
  let loading = true;
  let errorMsg = '';

  // Estados da Barra de Ferramentas
  let viewMode: 'grid' | 'list' = 'grid';
  let searchQuery = '';
  let filterStyle = '';
  let filterKey = '';
  let filterBpm = ''; 
  let showFilters = false; // Toggle para mobile

  // Paginação
  let currentPage = 1;
  let pageSize = 9;

  const tonsMaiores = ['C', 'C# / Db', 'D', 'D# / Eb', 'E', 'F', 'F# / Gb', 'G', 'G# / Ab', 'A', 'A# / Bb', 'B'];
  const tonsMenores = ['Cm', 'C#m / Dbm', 'Dm', 'D#m / Ebm', 'Em', 'Fm', 'F#m / Gbm', 'Gm', 'G#m / Abm', 'Am', 'A#m / Bbm', 'Bm'];

  export async function loadSongs() {
    loading = true;
    errorMsg = '';
    try {
      const { data, error } = await supabase
        .from('app_musicas')
        .select('*')
        .order('titulo', { ascending: true });

      if (error) throw error;
      songs = data || [];
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadSongs();
  });

  async function deleteSong(id: number) {
    if (!confirm("Deseja realmente remover esta música do banco de dados?")) return;
    const { error } = await supabase.from('app_musicas').delete().eq('id', id);
    if (error) alert("Erro ao excluir: " + error.message);
    else loadSongs();
  }

  // Lógica de Filtros Reativa
  $: filteredSongs = songs.filter(song => {
    const matchSearch = (song.titulo || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (song.artista || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStyle = filterStyle === '' || song.estilo === filterStyle;
    const matchKey = filterKey === '' || song.tom_original === filterKey;
    
    let matchBpm = true;
    if (filterBpm === 'Lentas (<90)') matchBpm = song.bpm && song.bpm < 90;
    else if (filterBpm === 'Médias (90-120)') matchBpm = song.bpm && song.bpm >= 90 && song.bpm <= 120;
    else if (filterBpm === 'Rápidas (>120)') matchBpm = song.bpm && song.bpm > 120;

    return matchSearch && matchStyle && matchKey && matchBpm;
  });

  // Reset da página ao alterar filtros
  $: if (searchQuery !== null || filterStyle !== null || filterKey !== null || filterBpm !== null || pageSize !== null) {
    currentPage = 1;
  }

  // Lógica de Paginação Reativa
  $: totalPages = Math.ceil(filteredSongs.length / pageSize) || 1;
  $: paginatedSongs = filteredSongs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function prevPage() { if (currentPage > 1) currentPage--; }
  function nextPage() { if (currentPage < totalPages) currentPage++; }
  function resetFilters() {
    searchQuery = ''; filterStyle = ''; filterKey = ''; filterBpm = '';
  }
</script>

<div class="w-full">
  
  <!-- Barra de Ferramentas -->
  <div class="bg-white dark:bg-brand-cardBg border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 mb-6 shadow-sm transition-colors duration-300">
    <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
      
      <!-- Busca e Botão de Filtros (Mobile) -->
      <div class="flex gap-2 flex-1">
        <div class="relative flex-1 sm:max-w-xs">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400"></i>
          <input type="text" bind:value={searchQuery} placeholder="Buscar título ou artista..." 
                 class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-accent transition-colors duration-300">
        </div>
        <button on:click={() => showFilters = !showFilters} class="sm:hidden px-3 py-2 border border-slate-300 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/80">
          <i class="fa-solid fa-filter"></i>
        </button>
      </div>

      <!-- Controles de Visualização e Paginação -->
      <div class="flex items-center gap-2 justify-end">
        <select bind:value={pageSize} class="text-xs border border-slate-300 dark:border-white/10 rounded-xl px-2 py-2 bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 transition-colors duration-300 outline-none">
          <option value={9}>9 por pág.</option>
          <option value={18}>18 por pág.</option>
          <option value={36}>36 por pág.</option>
          <option value={9999}>Ver todas</option>
        </select>
        
        <div class="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-300 dark:border-white/10 transition-colors duration-300">
          <button on:click={() => viewMode = 'grid'} class="px-2.5 py-1 text-xs rounded-lg transition-colors {viewMode === 'grid' ? 'bg-brand-accent text-black font-bold shadow' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}">
            <i class="fa-solid fa-grip"></i>
          </button>
          <button on:click={() => viewMode = 'list'} class="px-2.5 py-1 text-xs rounded-lg transition-colors {viewMode === 'list' ? 'bg-brand-accent text-black font-bold shadow' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}">
            <i class="fa-solid fa-list"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Filtros Avançados -->
    <div class="{showFilters ? 'block' : 'hidden'} sm:block mt-3 pt-3 border-t border-slate-200 dark:border-white/10 transition-colors duration-300">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select bind:value={filterStyle} class="text-xs border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 transition-colors duration-300 outline-none">
          <option value="">Todos os Estilos</option>
          <option value="Adoração / Exaltação">Adoração / Exaltação</option>
          <option value="Celebração / Júbilo">Celebração / Júbilo</option>
          <option value="Rendição / Devoção">Rendição / Devoção</option>
        </select>

        <select bind:value={filterKey} class="text-xs border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 transition-colors duration-300 outline-none">
          <option value="">Todos os Tons</option>
          <optgroup label="Maiores">
            {#each tonsMaiores as tom}<option value={tom}>{tom}</option>{/each}
          </optgroup>
          <optgroup label="Menores">
            {#each tonsMenores as tom}<option value={tom}>{tom}</option>{/each}
          </optgroup>
        </select>

        <div class="flex gap-2">
          <select bind:value={filterBpm} class="flex-1 text-xs border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 transition-colors duration-300 outline-none">
            <option value="">Todos os BPMs</option>
            <option value="Lentas (<90)">Lentas (&lt;90)</option>
            <option value="Médias (90-120)">Médias (90-120)</option>
            <option value="Rápidas (>120)">Rápidas (&gt;120)</option>
          </select>
          <button on:click={resetFilters} class="px-2 text-xs text-brand-accent hover:text-[#6ab3a3] font-bold" title="Limpar Filtros">
            <i class="fa-solid fa-eraser"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Estado de Carregamento e Erros -->
  {#if loading}
    <div class="bg-white dark:bg-brand-cardBg border border-slate-200 dark:border-white/10 p-12 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse transition-colors duration-300">
      Carregando repertório...
    </div>
  {:else if errorMsg}
    <div class="bg-white dark:bg-brand-cardBg border border-red-200 dark:border-red-500/20 p-12 rounded-3xl text-center text-red-500 text-sm font-medium transition-colors duration-300">
      Erro ao carregar: {errorMsg}
    </div>
  {:else if filteredSongs.length === 0}
    <div class="bg-white dark:bg-brand-cardBg border border-slate-200 dark:border-white/10 p-12 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors duration-300">
      Nenhuma música encontrada com estes filtros.
    </div>
  {:else}
    
    <!-- Renderização Condicional: Grade ou Lista -->
    {#if viewMode === 'grid'}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {#each paginatedSongs as song (song.id)}
          <div class="bg-white dark:bg-brand-cardBg border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between group transition duration-300 hover:-translate-y-1 hover:border-brand-accent/50 dark:hover:border-brand-accent/30 shadow-sm hover:shadow-lg dark:shadow-xl dark:hover:shadow-2xl">
            <div>
              <div class="relative w-full aspect-video bg-slate-900 overflow-hidden">
                {#if song.youtube_id}
                  <img src={`https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg`} alt={song.titulo} class="w-full h-full object-cover scale-[1.05] group-hover:scale-110 transition duration-700 ease-out" loading="lazy">
                {:else}
                  <div class="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-900">
                    <i class="fa-solid fa-music text-3xl"></i>
                  </div>
                {/if}
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                <div class="absolute top-3 right-3 z-10">
                  <span class="text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-xl bg-white/90 dark:bg-slate-950/80 text-slate-800 dark:text-slate-300 shadow-lg border border-slate-200 dark:border-white/10 backdrop-blur-md transition-colors duration-300">
                    Tom: {song.tom_original || '--'}
                  </span>
                </div>
              </div>
              <div class="p-4 sm:p-5">
                {#if song.youtube_id}
                  <a href={`https://youtu.be/${song.youtube_id}`} target="_blank" rel="noopener noreferrer" class="hover:underline decoration-brand-accent underline-offset-2 outline-none">
                    <h4 class="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-brand-accent transition duration-200">{song.titulo}</h4>
                  </a>
                {:else}
                  <h4 class="font-bold text-slate-900 dark:text-white text-base leading-tight transition duration-200">{song.titulo}</h4>
                {/if}
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 transition-colors duration-300">{song.artista || 'Desconhecido'}</p>
                <div class="mt-3 flex items-center gap-2 flex-wrap">
                  {#if song.estilo}
                    <span class="text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 transition-colors duration-300">
                      {song.estilo}
                    </span>
                  {/if}
                  {#if song.bpm}
                    <span class="text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 transition-colors duration-300">
                      {song.bpm} BPM
                    </span>
                  {/if}
                </div>
              </div>
            </div>
            {#if isAdmin}
              <div class="px-5 pb-4 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2 transition-colors duration-300">
                <button on:click={() => dispatch('edit', song)} class="text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition active:scale-95"><i class="fa-solid fa-pen-to-square"></i></button>
                <button on:click={() => deleteSong(song.id)} class="text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-red-100 dark:hover:bg-red-950/60 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition active:scale-95"><i class="fa-solid fa-trash"></i></button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <!-- Visualização em Lista Compacta -->
      <div class="space-y-3">
        {#each paginatedSongs as song (song.id)}
          <div class="bg-white dark:bg-brand-cardBg border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition duration-300 flex flex-col md:flex-row md:items-center justify-between gap-3 group">
            <div class="flex items-center gap-4 min-w-0 flex-1">
              <div class="w-16 h-10 sm:w-20 sm:h-12 rounded-lg bg-slate-200 dark:bg-slate-900 shrink-0 overflow-hidden relative border border-slate-200 dark:border-white/10">
                {#if song.youtube_id}
                  <img src={`https://img.youtube.com/vi/${song.youtube_id}/default.jpg`} class="w-full h-full object-cover scale-[1.3] group-hover:scale-[1.4] transition duration-500" alt="thumb">
                {:else}
                  <div class="w-full h-full flex items-center justify-center text-slate-400"><i class="fa-solid fa-music text-xs"></i></div>
                {/if}
              </div>
              <div class="min-w-0 flex-1">
                {#if song.youtube_id}
                  <a href={`https://youtu.be/${song.youtube_id}`} target="_blank" rel="noopener noreferrer" class="hover:underline decoration-brand-accent underline-offset-2 outline-none">
                    <h4 class="font-bold text-slate-900 dark:text-white text-sm truncate">{song.titulo}</h4>
                  </a>
                {:else}
                  <h4 class="font-bold text-slate-900 dark:text-white text-sm truncate">{song.titulo}</h4>
                {/if}
                <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{song.artista || 'Desconhecido'}</p>
                <div class="flex md:hidden gap-1.5 mt-1.5 flex-wrap">
                  <span class="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">Tom: {song.tom_original || '--'}</span>
                  {#if song.bpm}<span class="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">{song.bpm}</span>{/if}
                </div>
              </div>
            </div>
            
            <div class="hidden md:flex items-center gap-3 shrink-0">
              {#if song.estilo}<span class="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">{song.estilo}</span>{/if}
              {#if song.bpm}<span class="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">{song.bpm} BPM</span>{/if}
              <span class="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-white/10 shadow-inner">Tom: {song.tom_original || '--'}</span>
            </div>

            {#if isAdmin}
              <div class="flex items-center gap-1 justify-end pt-2 md:pt-0 border-t md:border-0 border-slate-100 dark:border-white/5 shrink-0">
                <button on:click={() => dispatch('edit', song)} class="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-2 rounded-lg text-xs transition"><i class="fa-solid fa-pen-to-square"></i></button>
                <button on:click={() => deleteSong(song.id)} class="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg text-xs transition"><i class="fa-solid fa-trash"></i></button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Controles de Paginação -->
    {#if totalPages > 1}
      <div class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-5 transition-colors duration-300">
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredSongs.length)} de {filteredSongs.length} músicas
        </span>
        <div class="flex items-center gap-1.5">
          <button on:click={prevPage} disabled={currentPage === 1} class="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition">
            <i class="fa-solid fa-chevron-left text-xs"></i>
          </button>
          
          <div class="flex items-center gap-1 px-2">
            {#each Array.from({ length: Math.min(5, totalPages) }) as _, i}
              {@const pageNum = totalPages <= 5 ? i + 1 : (currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i))}
              <button on:click={() => currentPage = pageNum} class="w-8 h-8 rounded-lg text-xs font-bold transition {currentPage === pageNum ? 'bg-brand-accent text-black shadow-md border-brand-accent' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}">
                {pageNum}
              </button>
            {/each}
          </div>

          <button on:click={nextPage} disabled={currentPage === totalPages} class="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition">
            <i class="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>