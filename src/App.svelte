<script lang="ts">
  import './app.css';
  import { onMount } from 'svelte';
  import { supabase } from './lib/supabase';
  import AuthModal from './components/AuthModal.svelte';
  import SongList from './components/SongList.svelte';
  import SongModal from './components/SongModal.svelte';
  import ServiceList from './components/ServiceList.svelte';
  import ServiceModal from './components/ServiceModal.svelte';

  let session: any = null;
  let showAuthModal = false;
  let showSongModal = false;
  let showServiceModal = false;
  
  let activeTab: 'songs' | 'history' = 'songs';

  let songListRef: SongList;
  let serviceListRef: ServiceList;
  let songToEdit: any = null;
  let serviceToEdit: any = null;

  let isDarkMode = true;

  onMount(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      isDarkMode = false;
    } else if (savedTheme === 'dark') {
      isDarkMode = true;
    } else {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();

    supabase.auth.getSession().then(({ data }) => {
      session = data.session;
    });

    supabase.auth.onAuthStateChange((_event, _session) => {
      session = _session;
    });
  });

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    applyTheme();
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }

  function applyTheme() {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function openNewSongModal() {
    songToEdit = null;
    showSongModal = true;
  }

  function handleEditSong(event: CustomEvent) {
    songToEdit = event.detail;
    showSongModal = true;
  }

  function onSongSaved() {
    showSongModal = false;
    songListRef?.loadSongs();
  }

  function openNewServiceModal() {
    serviceToEdit = null;
    showServiceModal = true;
  }

  function handleEditService(event: CustomEvent) {
    serviceToEdit = event.detail;
    showServiceModal = true;
  }

  function onServiceSaved() {
    showServiceModal = false;
    if (activeTab === 'history') {
      serviceListRef?.loadServices();
    } else {
      activeTab = 'history';
    }
  }
</script>

<div class="fixed top-0 left-1/4 w-96 h-96 bg-brand-accent/20 dark:bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none -z-10 transition-colors duration-300"></div>

<header class="bg-white/90 dark:bg-brand-darkBg/90 backdrop-blur-lg border-b border-slate-200 dark:border-white/10 text-slate-900 dark:text-white sticky top-0 z-30 transition-colors duration-300">
  <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <!-- Logo Vetorizada Responsiva -->
      <div class="w-10 h-10 flex items-center justify-center">
        <svg viewBox="0 0 100 100" class="w-full h-full text-slate-900 dark:text-white" fill="currentColor">
          <path d="M 15 15 L 85 15 L 85 85 L 60 85 L 60 75 L 75 75 L 75 25 L 25 25 L 25 75 L 45 75 L 45 85 L 15 85 Z" />
          <path d="M 28 68 L 48 45 L 58 55 L 65 48 L 73 58 L 65 58 L 58 65 L 48 55 L 40 68 Z" />
        </svg>
      </div>
      <div>
        <h1 class="text-sm font-extrabold tracking-wider uppercase leading-tight">Casa da Colina</h1>
        <p class="text-[10px] text-brand-accent font-semibold tracking-wider uppercase">Repertório V2</p>
      </div>
    </div>
    
    <div class="flex items-center gap-3">
      <button on:click={toggleTheme} class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition">
        <i class="fa-solid {isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>
      </button>

      {#if session}
        <span class="hidden sm:inline-block text-xs bg-brand-accent/20 text-brand-accent font-bold px-3 py-1.5 rounded-xl border border-brand-accent/40">
          <i class="fa-solid fa-shield-halved mr-1"></i> Admin
        </span>
        <button on:click={handleLogout} class="text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition">
          Sair
        </button>
      {:else}
        <button on:click={() => showAuthModal = true} class="text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition">
          <i class="fa-solid fa-lock text-brand-accent mr-1"></i> Login
        </button>
      {/if}
    </div>
  </div>
  
  <div class="bg-white/80 dark:bg-brand-darkBg/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
    <div class="max-w-6xl mx-auto px-4 flex gap-6">
      <button on:click={() => activeTab = 'songs'} class="py-3 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 transition {activeTab === 'songs' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}">
        <i class="fa-solid fa-music"></i> Músicas
      </button>
      <button on:click={() => activeTab = 'history'} class="py-3 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 transition {activeTab === 'history' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}">
        <i class="fa-solid fa-calendar-days"></i> Histórico
      </button>
    </div>
  </div>
</header>

<main class="max-w-6xl mx-auto px-4 py-6 w-full pb-20">
  
  {#if activeTab === 'songs'}
    <section>
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-lg font-extrabold text-slate-900 dark:text-white">Repertório</h2>
        {#if session}
          <button on:click={openNewSongModal} class="text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 px-3.5 py-2 rounded-xl font-bold shadow-sm transition active:scale-95">
            <i class="fa-solid fa-plus mr-1"></i> Música
          </button>
        {/if}
      </div>
      
      <SongList bind:this={songListRef} isAdmin={!!session} on:edit={handleEditSong} />
    </section>
  {/if}

  {#if activeTab === 'history'}
    <section>
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-lg font-extrabold text-slate-900 dark:text-white">Cultos Anteriores</h2>
        {#if session}
          <button on:click={openNewServiceModal} class="text-xs bg-brand-accent hover:bg-[#6ab3a3] text-black px-4 py-2 rounded-xl font-extrabold shadow-lg shadow-brand-accent/20 transition active:scale-95">
            <i class="fa-solid fa-plus mr-1"></i> Registrar Culto
          </button>
        {/if}
      </div>

      <ServiceList bind:this={serviceListRef} isAdmin={!!session} on:edit={handleEditService} />
    </section>
  {/if}

</main>

{#if showAuthModal}
  <AuthModal on:close={() => showAuthModal = false} />
{/if}

{#if showSongModal}
  <SongModal {songToEdit} on:close={() => showSongModal = false} on:save={onSongSaved} />
{/if}

{#if showServiceModal}
  <ServiceModal {serviceToEdit} on:close={() => showServiceModal = false} on:save={onServiceSaved} />
{/if}