
  // ── PROGRESS BAR ──
  const sections = document.querySelectorAll('.form-section');
  const stepDots = document.querySelectorAll('.step-dot');
  const progressFill = document.getElementById('progressFill');

  function updateProgress() {
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = Math.min((scrollY / docH) * 100, 100);
    progressFill.style.width = pct + '%';

    let currentSection = 0;
    sections.forEach((s, i) => {
      const rect = s.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.5) currentSection = i;
    });

    stepDots.forEach((dot, i) => {
      dot.classList.remove('active', 'completed');
      if (i < currentSection) dot.classList.add('completed');
      else if (i === currentSection) dot.classList.add('active');
    });
  }

  window.addEventListener('scroll', updateProgress, { passive: true });

  function scrollToSection(index) {
    sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── CONDITIONAL PRAZO ──
  function checkSituacao() {
    const chaves = document.getElementById('s3').checked;
    const planta = document.getElementById('s4').checked;
    const field = document.getElementById('prazoEntrega');
    if (chaves || planta) {
      field.classList.add('visible');
    } else {
      field.classList.remove('visible');
    }
  }

  document.querySelectorAll('input[name="situacao"]').forEach(el => {
    el.addEventListener('change', checkSituacao);
  });

  // ── AESTHETIC CARDS ──
  function toggleAesthetic(card, value) {
    card.classList.toggle('selected');
    const input = card.querySelector('input');
    input.checked = card.classList.contains('selected');
  }

  // ── PALETTE CARDS ──
  function togglePaletteCard(card) {
    card.classList.toggle('selected');
    const input = card.querySelector('input');
    input.checked = card.classList.contains('selected');
  }

  // ── FILE UPLOADS ──
  function handleFiles(inputId, listId) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    list.innerHTML = '';
    Array.from(input.files).forEach((file, i) => {
      const tag = document.createElement('div');
      tag.className = 'file-tag';
      tag.innerHTML = `<span>📄 ${file.name.length > 24 ? file.name.slice(0,22)+'…' : file.name}</span><button type="button" onclick="removeFile('${inputId}','${listId}',${i})">×</button>`;
      list.appendChild(tag);
    });
  }

  function removeFile(inputId, listId, index) {
    // Simple re-render after removal (not actually removing from FileList, just visual)
    const list = document.getElementById(listId);
    list.children[index]?.remove();
  }

  // ── DRAG & DROP PRIORITY ──
  const priorityList = document.getElementById('priorityList');
  let dragging = null;

  priorityList.querySelectorAll('.priority-item').forEach(item => {
    item.addEventListener('dragstart', () => {
      dragging = item;
      setTimeout(() => item.classList.add('dragging'), 0);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      dragging = null;
      updateNumbers();
    });

    item.addEventListener('dragover', e => {
      e.preventDefault();
      const after = getDragAfter(priorityList, e.clientY);
      if (after == null) {
        priorityList.appendChild(dragging);
      } else {
        priorityList.insertBefore(dragging, after);
      }
    });
  });

  function getDragAfter(container, y) {
    const items = [...container.querySelectorAll('.priority-item:not(.dragging)')];
    return items.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function updateNumbers() {
    priorityList.querySelectorAll('.priority-item').forEach((item, i) => {
      item.querySelector('.priority-num').textContent = i + 1;
    });
  }

  // ── LUMINOSITY SLIDER ──
  const luminSlider = document.getElementById('luminSlider');
  const luminLabel = document.getElementById('luminLabel');
  const labels = ['Muito acolhedor e sombrio', 'Aconchegante', 'Equilibrado', 'Levemente luminoso', 'Luminoso', 'Muito luminoso e aéreo'];

  luminSlider.addEventListener('input', () => {
    const v = luminSlider.value;
    const idx = Math.floor(v / 100 * (labels.length - 1));
    luminLabel.textContent = labels[idx];
  });

  // ── FORM SUBMIT via EmailJS ──
  emailjs.init('YOUR_EMAILJS_PUBLIC_KEY'); // ← substitua pela sua Public Key do EmailJS

  document.getElementById('briefingForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.querySelector('.btn-submit');
    const btnSpan = btn.querySelector('span');
    btn.disabled = true;
    btnSpan.textContent = 'Enviando…';

    // Coleta todos os campos
    const fd = new FormData(this);

    // Campos de texto simples
    const get = k => fd.get(k) || '—';
    const getAll = k => fd.getAll(k).join(', ') || '—';

    // Prioridades ordenadas
    const priorities = [...document.querySelectorAll('#priorityList .priority-item')]
      .map((el, i) => `${i+1}º ${el.querySelector('.priority-text').textContent}`)
      .join('\n');

    // Nomes dos arquivos
    const filesEspaco = document.getElementById('filesEspaco');
    const filesRef = document.getElementById('filesRef');
    const nomesEspaco = filesEspaco.files.length
      ? Array.from(filesEspaco.files).map(f => f.name).join(', ')
      : '(nenhum)';
    const nomesRef = filesRef.files.length
      ? Array.from(filesRef.files).map(f => f.name).join(', ')
      : '(nenhum)';

    const templateParams = {
      to_email: 'isjf98@gmail.com',
      nome: get('nome'),
      email: get('email'),
      telefone: get('telefone'),
      cidade: get('cidade'),
      origem: get('origem'),
      tipo_imovel: get('tipo_imovel'),
      tipo_projeto: get('tipo_projeto'),
      situacao: get('situacao'),
      prazo_entrega: get('prazo_entrega'),
      area: get('area'),
      bairro: get('bairro'),
      prazo_projeto: get('prazo_projeto'),
      inicio: get('inicio'),
      ambientes: getAll('ambientes'),
      descricao_ambientes: get('descricao_ambientes'),
      arquivos_espaco: nomesEspaco,
      arquivos_ref: nomesRef,
      estilos: getAll('estilos'),
      paleta: getAll('paleta'),
      cores_especificas: get('cores_especificas'),
      luminosidade: get('luminosidade') + '/100',
      atmosfera: getAll('atmosfera'),
      prioridades: priorities,
      ambiente_chave: get('ambiente_chave'),
      orcamento: get('orcamento'),
      restricoes: get('restricoes'),
      sonho: get('sonho'),
      observacoes: get('observacoes'),
    };

    try {
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
      // ← substitua YOUR_SERVICE_ID e YOUR_TEMPLATE_ID pelos seus IDs do EmailJS
      document.getElementById('successOverlay').classList.add('visible');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Erro ao enviar:', err);
      alert('Ocorreu um erro ao enviar. Por favor, entre em contato diretamente pelo e-mail isjf98@gmail.com');
      btn.disabled = false;
      btnSpan.textContent = 'Enviar briefing';
    }
  });
