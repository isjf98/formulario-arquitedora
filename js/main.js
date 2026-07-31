
    // ── CONFIGURAÇÃO OFICIAL DO SUPABASE (upload de fotos e plantas) ──
  const RAW_SUPABASE_URL = 'https://aviokhkcdnoshjjlllmv.supabase.co/rest/v1/';
  const SUPABASE_URL     = RAW_SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const SUPABASE_ANON_KEY= 'sb_publishable_WZPHCDhgLtFCOV5w4ny6aw_ZBiWnlWe';
  const SUPABASE_BUCKET  = 'uploads arquitedora';

  let supabaseClient = null;
  if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && typeof supabase !== 'undefined') {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.warn('Supabase nao inicializado:', err);
    }
  }

  // Faz upload de um array de File para o bucket e retorna URLs públicas
  async function uploadFilesToSupabase(files, folder) {
    if (!supabaseClient || !files || files.length === 0) return '(nenhum)';
    const urls = [];
    for (const file of Array.from(files)) {
      const timestamp = Date.now();
      const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path      = `${folder}/${timestamp}_${safeName}`;
      const { data, error } = await supabaseClient
        .storage
        .from(SUPABASE_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (!error) {
        const { data: urlData } = supabaseClient
          .storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl(path);
        urls.push(urlData.publicUrl);
      } else {
        console.error('Erro ao enviar arquivo:', file.name, error.message);
        urls.push(`[ERRO: ${file.name}]`);
      }
    }
    return urls.length ? urls.join('\n') : '(nenhum)';
  }

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
    // Reconstrói a FileList real via DataTransfer, removendo o arquivo de fato
    // (antes, isso só removia visualmente e o arquivo continuava sendo "enviado")
    const input = document.getElementById(inputId);
    const dt = new DataTransfer();
    Array.from(input.files).forEach((file, i) => {
      if (i !== index) dt.items.add(file);
    });
    input.files = dt.files;
    handleFiles(inputId, listId);
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
  // IMPORTANTE: substitua os 3 valores abaixo pelos seus dados reais do EmailJS
  // (Public Key, Service ID e Template ID). Enquanto forem os placeholders
  // "YOUR_..._KEY/ID", o formulário NÃO envia e-mails de verdade.
  const EMAILJS_PUBLIC_KEY = 'NPEWtfDJ4DlXvFaTF';
  const EMAILJS_SERVICE_ID = 'arquitedora_servise';
  const EMAILJS_TEMPLATE_ID = 'template_q8wu7yo';

  // Antes, se o script do EmailJS (CDN externo) falhasse ao carregar — ad blocker,
  // rede instável, etc — emailjs.init(...) lançava um erro aqui e TODO o código
  // abaixo (inclusive o listener do botão "Enviar") deixava de ser registrado,
  // travando o formulário sem nenhum aviso ao usuário. Agora isso é tratado.
  let emailjsReady = false;
  if (typeof emailjs !== 'undefined') {
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      emailjsReady = true;
    } catch (err) {
      console.error('Falha ao inicializar o EmailJS:', err);
    }
  } else {
    console.error('Biblioteca EmailJS nao carregou (CDN indisponivel ou bloqueada).');
  }

  // ── VALIDAÇÃO CUSTOMIZADA DOS GRUPOS DE PÍLULAS ──
  // Os inputs radio desses grupos ficam com display:none (design em "pílulas"),
  // então o navegador NÃO consegue mostrar a validação nativa "required" neles —
  // ele apenas bloqueia o envio silenciosamente, sem nenhum aviso ao usuário.
  // Por isso validamos manualmente aqui e mostramos o erro de forma visível.
  const REQUIRED_GROUPS = [
    { name: 'tipo_imovel', message: 'Selecione o tipo de imóvel.' },
    { name: 'tipo_projeto', message: 'Selecione o tipo de projeto.' },
    { name: 'situacao', message: 'Selecione a situação do local.' },
    { name: 'orcamento', message: 'Selecione uma faixa de investimento.' },
  ];

  function validateRequiredGroups() {
    let firstInvalidGroup = null;
    REQUIRED_GROUPS.forEach(({ name, message }) => {
      const fieldGroup = document.querySelector(`input[name="${name}"]`).closest('.field-group');
      const errorEl = document.getElementById(`error-${name}`);
      const isChecked = document.querySelector(`input[name="${name}"]:checked`);
      if (!isChecked) {
        fieldGroup.classList.add('invalid');
        errorEl.textContent = message;
        if (!firstInvalidGroup) firstInvalidGroup = fieldGroup;
      } else {
        fieldGroup.classList.remove('invalid');
        errorEl.textContent = '';
      }
    });
    return firstInvalidGroup;
  }

  document.getElementById('briefingForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.querySelector('.btn-submit');
    const btnSpan = btn.querySelector('span');

    const firstInvalidGroup = validateRequiredGroups();
    if (firstInvalidGroup) {
      firstInvalidGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!emailjsReady || EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' || EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
      alert('No momento nao foi possivel enviar o formulario automaticamente. Por favor, entre em contato diretamente pelo e-mail isjf98@gmail.com - seus dados preenchidos nao foram perdidos, voce pode copia-los antes de sair da pagina.');
      return;
    }

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

    // Upload de arquivos para o Supabase (se configurado) ou lista nomes
    const filesEspaco = document.getElementById('filesEspaco');
    const filesRef    = document.getElementById('filesRef');

    let urlsEspaco, urlsRef;

    if (supabaseClient) {
      btnSpan.textContent = 'Enviando fotos…';
      // Upload paralelo dos dois grupos
      [urlsEspaco, urlsRef] = await Promise.all([
        uploadFilesToSupabase(filesEspaco.files, 'espaco'),
        uploadFilesToSupabase(filesRef.files,    'referencia'),
      ]);
    } else {
      // Fallback: só lista os nomes dos arquivos no e-mail
      urlsEspaco = filesEspaco.files.length
        ? Array.from(filesEspaco.files).map(f => f.name).join(', ')
        : '(nenhum)';
      urlsRef = filesRef.files.length
        ? Array.from(filesRef.files).map(f => f.name).join(', ')
        : '(nenhum)';
    }

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
      arquivos_espaco: urlsEspaco,
      arquivos_ref: urlsRef,
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
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      document.getElementById('successOverlay').classList.add('visible');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Erro ao enviar:', err);
      alert('Ocorreu um erro ao enviar. Por favor, entre em contato diretamente pelo e-mail isjf98@gmail.com');
      btn.disabled = false;
      btnSpan.textContent = 'Enviar briefing';
    }
  });

  // ── AESTHETIC CAROUSEL FUNCTIONS ──
  window.updateCardImage = function(card, index) {
    const images = JSON.parse(card.getAttribute('data-images') || '[]');
    if (!images.length) return;

    const newIndex = (index + images.length) % images.length;
    card.setAttribute('data-index', newIndex);

    const imgEl = card.querySelector('.card-img-real');
    if (imgEl) {
      imgEl.style.opacity = '0.3';
      setTimeout(() => {
        imgEl.src = images[newIndex];
        imgEl.style.opacity = '1';
      }, 120);
    }

    const dots = card.querySelectorAll('.carousel-dots span');
    dots.forEach((dot, i) => {
      if (i === newIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  };

  window.nextCardImage = function(event, btn) {
    if (event) event.stopPropagation();
    const card = btn.closest('.aesthetic-card');
    const currentIndex = parseInt(card.getAttribute('data-index') || '0', 10);
    updateCardImage(card, currentIndex + 1);
  };

  window.prevCardImage = function(event, btn) {
    if (event) event.stopPropagation();
    const card = btn.closest('.aesthetic-card');
    const currentIndex = parseInt(card.getAttribute('data-index') || '0', 10);
    updateCardImage(card, currentIndex - 1);
  };

  window.startCardCarousel = function(card) {
    if (card.carouselInterval) clearInterval(card.carouselInterval);
    card.carouselInterval = setInterval(() => {
      const currentIndex = parseInt(card.getAttribute('data-index') || '0', 10);
      updateCardImage(card, currentIndex + 1);
    }, 1500);
  };

  window.stopCardCarousel = function(card) {
    if (card.carouselInterval) {
      clearInterval(card.carouselInterval);
      card.carouselInterval = null;
    }
  };
