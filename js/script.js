// ==================================================
// script.js — RSVP (busca, grupo, confirmação)
// + popup de sucesso
// + refresh da página ao fechar
// ==================================================

(() => {
  const GET_CONVIDADOS_URL =
    'https://x8ki-letl-twmt.n7.xano.io/api:HBjTMGjT/convidados';

  const POST_CONFIRMACAO_URL =
    'https://x8ki-letl-twmt.n7.xano.io/api:HBjTMGjT/confirm';

  document.addEventListener('DOMContentLoaded', () => {
    // Elementos
    const inputNome = document.getElementById('buscaNome');
    const btnBuscar = document.getElementById('btnBuscar');
    const listaResultados = document.getElementById('resultadoBusca');

    const grupoArea = document.getElementById('grupoArea');
    const grupoLista = document.getElementById('grupoLista');
    const form = document.getElementById('formConfirmacao');
    const btnEnviar = document.getElementById('btnEnviar');
    const statusMsg = document.getElementById('statusMsg');
    const popup = document.getElementById('popupSucesso');
    const btnOkPopup = document.getElementById('btnOkPopup');

    // Estado
    let convidados = [];
    const grupos = new Map();
    let convidadoSelecionado = null;
    let enviando = false;

    // Utils
    const norm = (s) =>
      (s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const setStatus = (msg, ok = null) => {
      statusMsg.textContent = msg || '';
      statusMsg.style.color =
        ok === null ? '#333' : ok ? 'green' : '#b00020';
    };

    // =========================
    // Carregar convidados
    // =========================
    async function carregarConvidados() {
      try {
        setStatus('Carregando convidados…');
        btnEnviar.disabled = true;

        const res = await fetch(GET_CONVIDADOS_URL, {
          cache: 'no-store',
          headers: { Accept: 'application/json' }
        });

        if (!res.ok) throw new Error('Erro ao buscar convidados');

        const data = await res.json();
        convidados = data.filter(c => c.id != null && c.nome);

        grupos.clear();
        convidados.forEach(c => {
          const grupo = c.grupo || 'Sem grupo';
          if (!grupos.has(grupo)) grupos.set(grupo, []);
          grupos.get(grupo).push(c);
        });

        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('Erro ao carregar convidados.', false);
      }
    }

    // =========================
    // Buscar convidado
    // =========================
    function buscar() {
      const q = norm(inputNome.value);
      listaResultados.innerHTML = '';
      grupoArea.hidden = true;
      grupoLista.innerHTML = '';
      convidadoSelecionado = null;
      btnEnviar.disabled = true;

      if (!q) return;

      convidados
        .filter(c => norm(c.nome).includes(q))
        .slice(0, 20)
        .forEach(c => {
          const li = document.createElement('li');
          const btn = document.createElement('button');

          btn.type = 'button';
          btn.className = 'resultado-btn';
          btn.textContent = c.nome;
          btn.addEventListener('click', () => selecionarConvidado(c));

          li.appendChild(btn);
          listaResultados.appendChild(li);
        });
    }

    // =========================
    // Selecionar convidado
    // =========================
    function selecionarConvidado(c) {
      convidadoSelecionado = c;
      inputNome.value = c.nome;
      listaResultados.innerHTML = '';

      const membros = grupos.get(c.grupo || 'Sem grupo') || [c];
      grupoLista.innerHTML = '';

      membros.forEach(m => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = !!m.presenca;
        input.dataset.id = m.id;

        const span = document.createElement('span');
        span.textContent = m.nome;

        label.appendChild(input);
        label.appendChild(span);
        grupoLista.appendChild(label);
      });

      grupoArea.hidden = false;
      btnEnviar.disabled = false;
      setStatus('');
    }

    // =========================
    // Enviar confirmação
    // =========================
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (enviando || !convidadoSelecionado) return;

      const payload = Array.from(
        grupoLista.querySelectorAll('input[type="checkbox"]')
      ).map(ch => ({
        id: Number(ch.dataset.id),
        presenca: ch.checked
      }));

      if (!payload.length) {
        setStatus('Selecione ao menos uma pessoa.', false);
        return;
      }

      try {
        enviando = true;
        btnEnviar.disabled = true;
        setStatus('Enviando confirmação…');

        const res = await fetch(POST_CONFIRMACAO_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ info: payload })
        });

        if (!res.ok) throw new Error('Erro ao enviar confirmação');

        setStatus('');
        mostrarPopupSucesso();
      } catch (err) {
        console.error(err);
        setStatus('Erro ao enviar confirmação.', false);
        btnEnviar.disabled = false;
      } finally {
        enviando = false;
      }
    });

    // =========================
    // Popup + refresh
    // =========================
    function mostrarPopupSucesso() {
      popup.hidden = false;
      document.body.style.overflow = 'hidden';

      const fechar = () => {
        popup.hidden = true;
        document.body.style.overflow = '';
        window.location.reload(); // 🔄 refresh
      };

      btnOkPopup?.focus();
      btnOkPopup?.addEventListener('click', fechar, { once: true });

      popup.addEventListener('click', (e) => {
        if (e.target === popup) fechar();
      }, { once: true });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fechar();
      }, { once: true });
    }

    // =========================
    // Eventos
    // =========================
    btnBuscar.addEventListener('click', buscar);

    inputNome.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscar();
      }
    });

    // Start
    carregarConvidados();
  });
})();
