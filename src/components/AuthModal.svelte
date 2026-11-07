<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '../lib/supabase';

  const dispatch = createEventDispatcher();
  
  let email = '';
  let password = '';
  let loading = false;
  let errorMessage = '';

  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    errorMessage = '';

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      errorMessage = 'Credenciais inválidas. Tente novamente.';
      loading = false;
    } else {
      closeModal();
    }
  }

  function closeModal() {
    dispatch('close');
  }
</script>

<div class="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-colors duration-300">
  <div class="bg-white/95 dark:bg-brand-darkBg/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-slate-900 dark:text-white transition-colors duration-300">
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10 transition-colors duration-300">
      <h3 class="text-base font-extrabold flex items-center gap-2">
        <i class="fa-solid fa-shield-halved text-brand-accent"></i> Acesso Administrador
      </h3>
      <button on:click={closeModal} class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full transition">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>
    </div>

    <form on:submit={handleLogin} class="space-y-4">
      <div>
        <label for="email" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 transition-colors duration-300">E-mail</label>
        <input type="email" id="email" bind:value={email} placeholder="admin@igreja.com" required
               class="w-full text-sm border border-slate-300 dark:border-white/10 rounded-2xl px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-300">
      </div>

      <div>
        <label for="password" class="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 transition-colors duration-300">Senha</label>
        <input type="password" id="password" bind:value={password} placeholder="••••••••" required
               class="w-full text-sm border border-slate-300 dark:border-white/10 rounded-2xl px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-300">
      </div>

      {#if errorMessage}
        <p class="text-xs text-red-500 dark:text-red-400 font-semibold">{errorMessage}</p>
      {/if}

      <div class="flex justify-end pt-2">
        <button type="submit" disabled={loading} class="px-5 py-2.5 text-xs bg-brand-accent hover:bg-[#6ab3a3] text-black font-extrabold rounded-xl shadow-lg shadow-brand-accent/20 transition active:scale-95 disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </form>
  </div>
</div>