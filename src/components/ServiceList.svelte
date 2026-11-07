<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { supabase } from '../lib/supabase';

  export let isAdmin = false;
  const dispatch = createEventDispatcher();

  let cultos: any[] = [];
  let loading = true;
  let errorMsg = '';

  // Estados da Barra de Ferramentas
  let searchQuery = '';
  let currentPage = 1;
  let pageSize = 5;

  export async function loadServices() {
    loading = true;
    errorMsg = '';
    try {
      const { data, error } = await supabase
        .from('app_cultos')
        .select(`
          id, data, tipo, observacoes, created_at,
          app_culto_musicas (
            id, posicao, tom_cantado, arranjo,
            app_musicas (id, titulo, artista, youtube_id),
            app_ministros (id, nome)
          )
        `)
        .order('data', { ascending: false });

      if (error) throw error;
      
      data?.forEach(culto => {
        culto.app_culto_musicas.sort((a: any, b: any) => a.posicao - b.posicao);
      });

      cultos = data || [];
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadServices();
  });

  function formatBRDate(dateString: string) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateString;
  }

  async function deleteService(id: number) {
    if (!confirm("Deseja realmente excluir este culto? Todas as execuções registradas nele serão apagadas permanentemente.")) return;
    const { error } = await supabase.from('app_cultos').delete().eq('id', id);
    if (error) alert("Erro ao excluir culto: " + error.message);
    else loadServices();
  }

  function shareService(culto: any) {
    const dataFormatada = formatBRDate(culto.data);
    let texto = `*Culto:* ${dataFormatada} - ${culto.tipo}\n`;
    
    if (culto.observacoes) {
      texto += `_(${culto.observacoes})_\n`;
    }
    
    texto += `\n*Setlist:*\n`;
    
    if (culto.app_culto_musicas.length === 0) {
      texto += `Nenhuma música registrada.\n`;
    } else {
      culto.app_culto_musicas.forEach((exec: any) => {
        const titulo = exec.app_musicas?.titulo || 'Música Removida';
        const tom = exec.tom_cantado || '--';
        const ministro = exec.app_ministros?.nome || 'N/D';
        texto += `${exec.posicao}. ${titulo} (Tom: ${tom} - ${ministro})\n`;
        
        if (exec.app_musicas?.youtube_id) {
          texto += `    https://youtu.be/${exec.app_musicas.youtube_id}\n`;
        }
        if (exec.arranjo) {
          texto += `   ↳ _Arranjo: ${exec.arranjo}_\n`;
        }
      });
    }

    const encodedText = encodeURIComponent(texto);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  // Lógica de Filtros e Paginação Reativa
  $: filteredCultos = cultos.filter(culto => {
    const searchLower = searchQuery.toLowerCase();
    const matchTipo = (culto.tipo || '').toLowerCase().includes(searchLower);
    const matchObs = (culto.observacoes || '').toLowerCase().includes(searchLower);
    const matchDate = formatBRDate(culto.data).includes(searchLower);
    return matchTipo || matchObs || matchDate;
  });

  $: if (searchQuery !== null || pageSize !== null) currentPage = 1;
  $: totalPages = Math.ceil(filteredCultos.length / pageSize) || 1;
  $: paginatedCultos = filteredCultos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function prevPage() { if (currentPage > 1) currentPage--; }
  function nextPage() { if (currentPage < totalPages) currentPage++; }
</script>

<div class="w-full">
  
  <!-- Barra de Ferramentas de Histórico -->
  <div class="bg-white dark:bg-brand-cardBg border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center transition-colors duration-300">
    <div class="relative w-full sm:w-80">
      <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400"></i>
      <input type="text" bind:value={searchQuery} placeholder="Buscar por data, tipo ou notas..." 
             class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-accent transition-colors duration-300">
    </div>
    
    <select bind:value={pageSize} class="w-full sm:w-auto text-xs border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 transition-colors duration-300 outline-none">
      <option value={5}>5 cultos por pág.</option>
      <option value={10}>10 cultos por pág.</option>
      <option value={20}>20 cultos por pág.</option>
    </select>
  </div>

  {#if loading}
    <div class="bg-white dark:bg-brand-cardBg border border-slate-200 dark:border-white/10 p-12 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse transition-colors duration-300">
      Carregando histórico...
    </div>
  {:else if errorMsg}
    <div class="bg-white dark:bg-brand-cardBg border border-red-200 dark:border-red-500/20 p-12 rounded-3xl text-center text-red-500 text-sm font-medium transition-colors duration-300">
      Erro ao carregar: {errorMsg}
    </div>
  {:else if filteredCultos.length === 0}
    <div class="bg-white dark:bg-brand-cardBg border border-slate-200 dark:border-white/10 p-12 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors duration-300">
      Nenhum culto encontrado.
    </div>
  {:else}
    <div class="space-y-5">
      {#each paginatedCultos as culto}
        <div class="bg-white dark:bg-brand-cardBg border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm transition-colors duration-300">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 mb-3 gap-3 transition-colors duration-300">
            <div>
              <h3 class="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 transition-colors duration-300">
                <i class="fa-solid fa-calendar-check text-brand-accent"></i> 
                {formatBRDate(culto.data)} - {culto.tipo}
              </h3>
              {#if culto.observacoes}
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-300">{culto.observacoes}</p>
              {/if}
            </div>
            
            <div class="flex items-center gap-2 self-start sm:self-auto">
              <span class="text-[10px] bg-brand-accent/20 text-brand-accent font-bold px-2.5 py-1 rounded-lg border border-brand-accent/30 mr-1">
                {culto.app_culto_musicas.length} músicas
              </span>

              <!-- Botão de Compartilhar (Visível para todos ou apenas admin? Mantido visível para todos para facilitar o uso da equipe) -->
              <button on:click={() => shareService(culto)} class="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold border border-green-200 dark:border-green-800/50 transition active:scale-95" title="Compartilhar no WhatsApp">
                <i class="fa-brands fa-whatsapp text-sm"></i>
              </button>
              
              {#if isAdmin}
                <button on:click={() => dispatch('edit', culto)} class="text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 transition active:scale-95" title="Editar Culto">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button on:click={() => deleteService(culto.id)} class="text-slate-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-red-100 dark:hover:bg-red-950/60 w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 transition active:scale-95" title="Excluir Culto">
                  <i class="fa-solid fa-trash"></i>
                </button>
              {/if}
            </div>
          </div>

          <div class="divide-y divide-slate-100 dark:divide-white/5 transition-colors duration-300">
            {#if culto.app_culto_musicas.length === 0}
               <p class="text-xs text-slate-500 py-2">Sem músicas registradas.</p>
            {/if}
            
            {#each culto.app_culto_musicas as execucao}
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 last:pb-0">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] font-black text-slate-400 dark:text-slate-500">{execucao.posicao}.</span>
                    {#if execucao.app_musicas?.youtube_id}
                      <a href={`https://youtu.be/${execucao.app_musicas.youtube_id}`} target="_blank" rel="noopener noreferrer" class="hover:underline decoration-brand-accent underline-offset-2 outline-none">
                        <h4 class="font-bold text-slate-900 dark:text-white text-sm transition-colors duration-300">
                          {execucao.app_musicas?.titulo || 'Música Removida'}
                        </h4>
                      </a>
                    {:else}
                      <h4 class="font-bold text-slate-900 dark:text-white text-sm transition-colors duration-300">
                        {execucao.app_musicas?.titulo || 'Música Removida'}
                      </h4>
                    {/if}
                    <span class="text-[11px] text-slate-500 dark:text-slate-400 truncate transition-colors duration-300">({execucao.app_musicas?.artista || 'N/D'})</span>
                  </div>
                  {#if execucao.arranjo}
                    <p class="text-[11px] text-slate-600 dark:text-slate-300 mt-1 ml-4 border-l-2 border-brand-accent/30 pl-2 transition-colors duration-300">
                      <span class="font-bold text-brand-accent/80">Arranjo:</span> {execucao.arranjo}
                    </p>
                  {/if}
                </div>
                <div class="flex items-center gap-2 shrink-0 pt-1 md:pt-0 ml-4 md:ml-0">
                  <span class="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 whitespace-nowrap transition-colors duration-300">
                    <i class="fa-solid fa-microphone mr-1 text-brand-accent"></i>
                    {execucao.app_ministros?.nome || 'N/D'}
                  </span>
                  <span class="text-[11px] bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-slate-300 font-black px-3 py-1 rounded-full border border-slate-300 dark:border-white/10 shadow-xs whitespace-nowrap transition-colors duration-300">
                    Tom: {execucao.tom_cantado || '--'}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <!-- Controles de Paginação -->
    {#if totalPages > 1}
      <div class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-5 transition-colors duration-300">
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredCultos.length)} de {filteredCultos.length} cultos
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