(() => {
  'use strict';
  // Front-end access gate for this prototype. Real authentication must be handled server-side.
  const AUTH_SESSION_KEY = 'popkor-auth-session-v1';
  if (sessionStorage.getItem(AUTH_SESSION_KEY) !== 'authenticated') {
    const requested = `${window.location.pathname.split('/').pop() || 'index.html'}${window.location.search || ''}`;
    if (!sessionStorage.getItem('popkor-auth-next')) sessionStorage.setItem('popkor-auth-next', requested);
    window.location.replace('login.html');
    return;
  }
  const STORAGE_KEY = 'popkor-management-v2';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const localDateTime = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  const inputDate = value => value ? String(value).slice(0,10) : today();
  const formatDate = value => {
    if (!value) return 'Sem data';
    const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(d.getTime()) ? 'Data inválida' : new Intl.DateTimeFormat('pt-BR', { dateStyle:'short', ...(String(value).includes('T') ? { timeStyle:'short' } : {}) }).format(d);
  };
  const id = prefix => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let messageTimer;
  function announce(message) {
    const node = $('#live-message');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => node.classList.remove('show'), 3400);
  }
  function demoData() {
    const day = today();
    const sales = [
      { id:'sale_demo_7', number:7, customer:'Maria', channel:'WhatsApp', fulfillment:'Entrega', productId:null, productName:'', quantity:1, total:45, status:'paid', date:`${day}T16:42`, notes:'' },
      { id:'sale_demo_6', number:6, customer:'Lúcia', channel:'WhatsApp', fulfillment:'Retirada', productId:null, productName:'', quantity:1, total:55, status:'paid', date:`${day}T15:18`, notes:'' },
      { id:'sale_demo_5', number:5, customer:'Maria', channel:'iFood', fulfillment:'Entrega', productId:null, productName:'', quantity:1, total:70, status:'paid', date:`${day}T14:06`, notes:'' },
      { id:'sale_demo_4', number:4, customer:'Camila', channel:'WhatsApp', fulfillment:'Entrega', productId:null, productName:'', quantity:1, total:265, status:'paid', date:`${day}T13:30`, notes:'' },
      { id:'sale_demo_3', number:3, customer:'João', channel:'iFood', fulfillment:'Entrega', productId:null, productName:'', quantity:1, total:110, status:'pending', date:`${day}T12:20`, notes:'' }
    ];
    return {
      settings: { userName:'Ana', brandName:'POPKOR', dailyGoal:600 },
      stock: [
        {id:'stock_demo_ninho', name:'Pipoca gourmet de Ninho', category:'Produto pronto', unit:'un.', quantity:8, minimum:10, cost:5, price:20, notes:''},
        {id:'stock_demo_ovo', name:'Pipoca gourmet Ovomaltine', category:'Produto pronto', unit:'un.', quantity:18, minimum:5, cost:5, price:20, notes:''},
        {id:'stock_demo_choc', name:'Chocolate branco', category:'Insumo', unit:'g', quantity:350, minimum:500, cost:0.04, price:0, notes:''},
        {id:'stock_demo_leite', name:'Leite em pó', category:'Insumo', unit:'g', quantity:220, minimum:250, cost:0.035, price:0, notes:''},
        {id:'stock_demo_emb', name:'Embalagens 100 g', category:'Embalagem', unit:'un.', quantity:120, minimum:30, cost:0.1, price:0, notes:''}
      ],
      sales,
      transactions: [
        ...sales.map(s => ({id:`txn_${s.id}`, date:inputDate(s.date), type:'income', category:'Venda', description:`Venda #${s.number} · ${s.customer}`, amount:s.total, status:s.status, saleId:s.id})),
        {id:'txn_demo_expense', date:day, type:'expense', category:'Insumos', description:'Compra de chocolate e embalagens', amount:86, status:'paid', saleId:null}
      ]
    };
  }
  function normalizeData(value) {
    if (!value || typeof value !== 'object' || !Array.isArray(value.stock) || !Array.isArray(value.sales) || !Array.isArray(value.transactions)) throw new Error('O arquivo não parece ser um backup válido da POPKOR.');
    return {
      settings: {userName:String(value.settings?.userName || 'Ana'), brandName:String(value.settings?.brandName || 'POPKOR'), dailyGoal:Math.max(0, Number(value.settings?.dailyGoal) || 0)},
      stock:value.stock.map(p => ({...p, id:String(p.id || id('stock')), name:String(p.name || 'Item sem nome'), category:String(p.category || 'Outro'), unit:String(p.unit || 'un.'), quantity:Math.max(0,Number(p.quantity)||0), minimum:Math.max(0,Number(p.minimum)||0), cost:Math.max(0,Number(p.cost)||0), price:Math.max(0,Number(p.price)||0), notes:String(p.notes||'')})),
      sales:value.sales.map(s => ({...s, id:String(s.id||id('sale')), number:Math.max(1,Number(s.number)||1), customer:String(s.customer||'Cliente'), channel:String(s.channel||'Outro'), fulfillment:String(s.fulfillment||'Retirada'), productId:s.productId ? String(s.productId) : null, productName:String(s.productName||''), quantity:Math.max(1,Number(s.quantity)||1), total:Math.max(0,Number(s.total)||0), status:s.status==='pending'?'pending':'paid', date:String(s.date||`${today()}T12:00`), notes:String(s.notes||'')})),
      transactions:value.transactions.map(t => ({...t, id:String(t.id||id('txn')), date:String(t.date||today()), type:t.type==='expense'?'expense':'income', category:String(t.category||'Outros'), description:String(t.description||'Movimentação'), amount:Math.max(0,Number(t.amount)||0), status:t.status==='pending'?'pending':'paid', saleId:t.saleId ? String(t.saleId) : null}))
    };
  }
  let data;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    data = raw ? normalizeData(JSON.parse(raw)) : demoData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    data = demoData();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) { /* Continue in memory if browser storage is disabled. */ }
    console.warn('A POPKOR está usando dados temporários nesta sessão:', error);
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
    catch (error) { console.error(error); announce('Não foi possível salvar neste navegador. Exporte um backup e verifique o espaço disponível.'); return false; }
  }
  function closeDialog(dialog) { if (dialog?.open) dialog.close(); }
  function setupCommon() {
    const page = document.body.dataset.page;
    const brand = $('.brand');
    if (brand) brand.textContent = data.settings.brandName || 'POPKOR';
    const caption = $('#today-label');
    if (caption && page === 'home') caption.textContent = new Intl.DateTimeFormat('pt-BR', {dateStyle:'full'}).format(new Date());
    $$('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => closeDialog(btn.closest('dialog'))));
    $$('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(dialog); }));
    const openSettings = $('#open-settings');
    if (openSettings) openSettings.addEventListener('click', () => {
      $('#setting-name').value = data.settings.userName;
      $('#setting-brand').value = data.settings.brandName;
      $('#setting-goal').value = data.settings.dailyGoal;
      $('#settings-dialog').showModal();
    });
    const settingsForm = $('#settings-form');
    if (settingsForm) settingsForm.addEventListener('submit', event => {
      event.preventDefault();
      data.settings.userName = $('#setting-name').value.trim() || 'Ana';
      data.settings.brandName = $('#setting-brand').value.trim() || 'POPKOR';
      data.settings.dailyGoal = Math.max(0, Number($('#setting-goal').value) || 0);
      save(); closeDialog($('#settings-dialog')); renderHome(); setupBrandName(); announce('Preferências salvas.');
    });
  }
  function setupBrandName() { const node = $('.brand'); if(node) node.textContent = data.settings.brandName || 'POPKOR'; }
  function isCritical(product) { return Number(product.quantity) <= Number(product.minimum); }
  function saleTransactions() {
    // Keep one financial entry associated with each sale and synchronize its fields.
    data.sales.forEach(sale => {
      let txn = data.transactions.find(t => t.saleId === sale.id);
      if (!txn) {
        txn = {id:id('txn'), date:inputDate(sale.date), type:'income', category:'Venda', description:`Venda #${sale.number} · ${sale.customer}`, amount:sale.total, status:sale.status, saleId:sale.id};
        data.transactions.push(txn);
      }
      Object.assign(txn, {date:inputDate(sale.date), type:'income', category:'Venda', description:`Venda #${sale.number} · ${sale.customer}`, amount:Number(sale.total)||0, status:sale.status, saleId:sale.id});
    });
    data.transactions = data.transactions.filter(t => !t.saleId || data.sales.some(s => s.id === t.saleId));
  }
  function sum(list, fn) { return list.reduce((total, item) => total + (Number(fn(item)) || 0), 0); }
  function renderHome() {
    const name = $('#greeting-title'); if (!name) return;
    name.textContent = `Bom trabalho, ${data.settings.userName || 'empreendedora'}!`;
    $('#greeting-subtitle').textContent = `${data.settings.brandName || 'POPKOR'} · resumo da operação`;
    const todaySales = data.sales.filter(s => inputDate(s.date) === today());
    const totalSales = sum(todaySales, s => s.total);
    const receivedToday = sum(todaySales.filter(s => s.status === 'paid'), s => s.total);
    const cash = sum(data.transactions.filter(t => t.status === 'paid'), t => t.type === 'income' ? t.amount : -t.amount);
    const receivable = sum(data.transactions.filter(t => t.status === 'pending'), t => t.amount);
    $('#metric-sales').textContent = money(totalSales);
    $('#metric-received').textContent = money(receivedToday);
    $('#metric-cash').textContent = money(cash);
    $('#metric-receivable').textContent = money(receivable);
    $('#metric-deliveries').textContent = todaySales.filter(s => s.fulfillment === 'Entrega').length;
    const critical = data.stock.filter(isCritical);
    $('#metric-critical').textContent = `${critical.length} ${critical.length === 1 ? 'item' : 'itens'}`;
    const goal = Math.max(0, Number(data.settings.dailyGoal) || 0);
    $('#goal-amount').textContent = money(goal);
    $('#goal-progress').value = goal > 0 ? Math.min(100, Math.round(totalSales / goal * 100)) : 0;
    $('#goal-description').textContent = goal > 0 ? `${money(totalSales)} em vendas hoje · ${Math.round(totalSales / goal * 100)}% da meta${totalSales >= goal ? ' alcançada!' : ''}` : 'Defina uma meta diária em “Personalizar” para acompanhar o progresso.';
    const channels = new Map();
    todaySales.forEach(s => channels.set(s.channel, (channels.get(s.channel)||0)+Number(s.total||0)));
    const channelRoot = $('#channel-summary');
    const maxChannel = Math.max(1, ...channels.values());
    channelRoot.innerHTML = channels.size ? [...channels.entries()].sort((a,b)=>b[1]-a[1]).map(([channel,total]) => `<div class="channel-item"><span>${escapeHTML(channel)}</span><span class="channel-track" aria-hidden="true"><span class="channel-fill" style="display:block;width:${Math.max(2, total/maxChannel*100)}%"></span></span><span class="channel-value">${money(total)}</span></div>`).join('') : '<p class="empty-state">Ainda não há vendas hoje.</p>';
    const recent = [...data.sales].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,3);
    $('#recent-sales').innerHTML = recent.length ? recent.map(s => `<article class="record"><div class="record-main"><div><div class="record-title">Venda #${s.number} · ${escapeHTML(s.customer)}</div><div class="record-subtitle">${escapeHTML(s.channel)} · ${escapeHTML(s.fulfillment)} · ${formatDate(s.date)}</div><span class="badge ${s.status==='paid'?'ok':''}">${s.status==='paid'?'Pago':'A receber'}</span></div><div class="record-meta"><div class="record-amount">${money(s.total)}</div></div></div><div class="record-actions"><a class="small-button" href="vendas.html?edit=${encodeURIComponent(s.id)}">Editar venda</a></div></article>`).join('') : '<p class="empty-state">Nenhuma venda cadastrada.</p>';
    $('#critical-stock-preview').innerHTML = critical.length ? critical.slice(0,4).map(p=>`<article class="record"><div class="record-main"><div><div class="record-title">${escapeHTML(p.name)}</div><div class="record-subtitle">Mínimo: ${p.minimum} ${escapeHTML(p.unit)}</div></div><div class="record-meta"><div class="record-amount">${p.quantity} ${escapeHTML(p.unit)}</div><span class="badge">Estoque baixo</span></div></div><div class="record-actions"><a class="small-button" href="estoque.html?edit=${encodeURIComponent(p.id)}">Ajustar estoque</a></div></article>`).join('') : '<p class="empty-state">Tudo certo! Nenhum item abaixo do mínimo.</p>';
  }
  // STOCK PAGE
  const stockDialog = $('#product-dialog');
  function productFormReset() {
    $('#product-form').reset(); $('#product-id').value=''; $('#product-quantity').value='0'; $('#product-minimum').value='0'; $('#product-cost').value='0'; $('#product-price').value='0'; $('#product-form-title').textContent='Adicionar item';
  }
  function openProductForm(product = null) {
    productFormReset();
    if (product) {
      $('#product-form-title').textContent='Editar item do estoque';
      for (const key of ['id','name','category','unit','quantity','minimum','cost','price','notes']) {
        const field = $(`#product-${key}`); if (field) field.value = product[key] ?? '';
      }
    }
    stockDialog.showModal(); $('#product-name').focus();
  }
  function renderStock() {
    const list = $('#stock-list'); if (!list) return;
    const query = ($('#stock-search').value || '').trim().toLocaleLowerCase('pt-BR');
    const filter = $('#stock-filter').value;
    const all = [...data.stock].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    $('#stock-count').textContent = data.stock.length;
    $('#stock-critical-count').textContent = data.stock.filter(isCritical).length;
    const filtered = all.filter(p => {
      const matches = `${p.name} ${p.category} ${p.notes}`.toLocaleLowerCase('pt-BR').includes(query);
      return matches && (filter === 'all' || (filter === 'critical' && isCritical(p)) || (filter === 'product' && p.category === 'Produto pronto') || (filter === 'ingredient' && p.category === 'Insumo'));
    });
    list.innerHTML = filtered.map(p => `<article class="record"><div class="record-main"><div><div class="record-title">${escapeHTML(p.name)}</div><div class="record-subtitle">${escapeHTML(p.category)} · ${money(p.cost)} custo por ${escapeHTML(p.unit)}${p.price>0?` · ${money(p.price)} venda`:''}</div><span class="badge ${isCritical(p)?'':'ok'}">${isCritical(p)?'Estoque baixo':'Disponível'}</span></div><div class="record-meta"><div class="record-amount">${p.quantity} ${escapeHTML(p.unit)}</div><div class="record-subtitle">Mínimo: ${p.minimum}</div></div></div>${p.notes?`<p class="record-subtitle">${escapeHTML(p.notes)}</p>`:''}<div class="record-actions"><button class="small-button" type="button" data-action="edit-product" data-id="${escapeHTML(p.id)}">Editar</button><button class="small-button" type="button" data-action="adjust-product" data-id="${escapeHTML(p.id)}">Ajustar quantidade</button><button class="small-button danger" type="button" data-action="delete-product" data-id="${escapeHTML(p.id)}">Excluir</button></div></article>`).join('');
    $('#stock-empty').hidden = filtered.length > 0;
  }
  function handleStock() {
    $('#new-product').addEventListener('click',()=>openProductForm());
    $('#stock-search').addEventListener('input',renderStock); $('#stock-filter').addEventListener('change',renderStock);
    $('#stock-list').addEventListener('click',event=>{
      const btn=event.target.closest('button[data-action]'); if(!btn)return;
      const product=data.stock.find(p=>p.id===btn.dataset.id); if(!product)return;
      if(btn.dataset.action==='edit-product') openProductForm(product);
      if(btn.dataset.action==='adjust-product') {
        const raw=window.prompt(`Quantidade atual de “${product.name}”: ${product.quantity} ${product.unit}\nDigite a nova quantidade (não a diferença):`,String(product.quantity));
        if(raw===null)return; const qty=Number(raw); if(!Number.isFinite(qty)||qty<0){announce('Informe uma quantidade válida, igual ou maior que zero.');return;}
        product.quantity=qty; save(); renderStock(); announce('Quantidade do estoque atualizada.');
      }
      if(btn.dataset.action==='delete-product') {
        const linked=data.sales.filter(s=>s.productId===product.id).length;
        const extra=linked?`\n${linked} venda(s) antiga(s) manterão o nome do produto no histórico.`:'';
        if(!window.confirm(`Excluir “${product.name}” do estoque?${extra}`))return;
        data.sales.forEach(s=>{if(s.productId===product.id){s.productId=null;s.productName=product.name;}});
        data.stock=data.stock.filter(p=>p.id!==product.id); save(); renderStock(); announce('Item excluído do estoque.');
      }
    });
    $('#product-form').addEventListener('submit',event=>{
      event.preventDefault();
      const oldId=$('#product-id').value;
      const obj={id:oldId||id('stock'),name:$('#product-name').value.trim(),category:$('#product-category').value,unit:$('#product-unit').value,quantity:Number($('#product-quantity').value),minimum:Number($('#product-minimum').value),cost:Number($('#product-cost').value)||0,price:Number($('#product-price').value)||0,notes:$('#product-notes').value.trim()};
      if(!obj.name||!Number.isFinite(obj.quantity)||obj.quantity<0||obj.minimum<0||obj.cost<0||obj.price<0){announce('Confira o nome e os valores informados.');return;}
      if(oldId){data.stock=data.stock.map(p=>p.id===oldId?obj:p);}else{data.stock.push(obj);}
      save();closeDialog(stockDialog);renderStock();updateProductOptions();renderHome();announce(oldId?'Item atualizado.':'Item adicionado ao estoque.');
    });
    const editId=new URLSearchParams(location.search).get('edit'); if(editId){const product=data.stock.find(p=>p.id===editId);if(product)openProductForm(product);}
  }
  // SALES PAGE
  const saleDialog=$('#sale-dialog');
  function updateProductOptions(selected='') {
    const select=$('#sale-product'); if(!select)return;
    select.innerHTML='<option value="">Não vincular produto</option>'+[...data.stock].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(p=>`<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)} · ${p.quantity} ${escapeHTML(p.unit)}</option>`).join('');
    select.value=selected;
  }
  function resetSaleForm(){
    $('#sale-form').reset();$('#sale-id').value='';$('#sale-form-title').textContent='Cadastrar venda';$('#sale-date').value=localDateTime();$('#sale-quantity').value='1';$('#sale-total').value='0.01';$('#sale-total').dataset.manual='false';updateProductOptions('');
  }
  function openSaleForm(sale=null){
    resetSaleForm();
    if(sale){
      $('#sale-form-title').textContent=`Editar venda #${sale.number}`;$('#sale-id').value=sale.id;
      $('#sale-customer').value=sale.customer;$('#sale-date').value=sale.date;$('#sale-channel').value=sale.channel;$('#sale-fulfillment').value=sale.fulfillment;$('#sale-quantity').value=sale.quantity;$('#sale-total').value=sale.total;$('#sale-status').value=sale.status;$('#sale-notes').value=sale.notes||'';updateProductOptions(sale.productId||'');$('#sale-total').dataset.manual='true';
    }
    saleDialog.showModal();$('#sale-customer').focus();
  }
  function renderSales(){
    const list=$('#sales-list');if(!list)return;
    const query=$('#sales-search').value.trim().toLocaleLowerCase('pt-BR');const status=$('#sales-status-filter').value;
    const sorted=[...data.sales].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const filtered=sorted.filter(s=>`${s.customer} ${s.channel} ${s.fulfillment} ${s.number} ${s.notes}`.toLocaleLowerCase('pt-BR').includes(query)&&(status==='all'||s.status===status));
    $('#sales-count').textContent=data.sales.length;$('#sales-total').textContent=money(sum(data.sales,s=>s.total));
    list.innerHTML=filtered.map(s=>`<article class="record"><div class="record-main"><div><div class="record-title">Venda #${s.number} · ${escapeHTML(s.customer)}</div><div class="record-subtitle">${escapeHTML(s.channel)} · ${escapeHTML(s.fulfillment)} · ${formatDate(s.date)}</div>${s.productName||data.stock.find(p=>p.id===s.productId)?`<div class="record-subtitle">Produto: ${escapeHTML(s.productName||data.stock.find(p=>p.id===s.productId)?.name||'Produto removido')} · Quantidade: ${s.quantity}</div>`:''}${s.notes?`<div class="record-subtitle">${escapeHTML(s.notes)}</div>`:''}<span class="badge ${s.status==='paid'?'ok':''}">${s.status==='paid'?'Pago':'A receber'}</span></div><div class="record-meta"><div class="record-amount">${money(s.total)}</div></div></div><div class="record-actions"><button type="button" class="small-button" data-action="edit-sale" data-id="${escapeHTML(s.id)}">Editar</button><button type="button" class="small-button danger" data-action="delete-sale" data-id="${escapeHTML(s.id)}">Excluir</button></div></article>`).join('');
    $('#sales-empty').hidden=filtered.length>0;
  }
  function handleSales(){
    $('#new-sale').addEventListener('click',()=>openSaleForm());$('#sales-search').addEventListener('input',renderSales);$('#sales-status-filter').addEventListener('change',renderSales);
    $('#sale-product').addEventListener('change',()=>{
      const product=data.stock.find(p=>p.id===$('#sale-product').value); if(product){$('#sale-total').value=(Number(product.price||0)*Math.max(1,Number($('#sale-quantity').value)||1)).toFixed(2);$('#sale-total').dataset.manual='false';}
    });
    $('#sale-quantity').addEventListener('input',()=>{const p=data.stock.find(p=>p.id===$('#sale-product').value);if(p&&$('#sale-total').dataset.manual!=='true')$('#sale-total').value=(Number(p.price||0)*Math.max(1,Number($('#sale-quantity').value)||1)).toFixed(2);});
    $('#sale-total').addEventListener('input',()=>$('#sale-total').dataset.manual='true');
    $('#sales-list').addEventListener('click',event=>{const btn=event.target.closest('button[data-action]');if(!btn)return;const sale=data.sales.find(s=>s.id===btn.dataset.id);if(!sale)return;if(btn.dataset.action==='edit-sale')openSaleForm(sale);if(btn.dataset.action==='delete-sale'&&window.confirm(`Excluir a venda #${sale.number} de ${sale.customer}? O registro financeiro vinculado será removido e o estoque relacionado será devolvido.`)){deleteSale(sale.id);renderSales();renderHome();announce('Venda e movimentação vinculada excluídas.');}});
    $('#sale-form').addEventListener('submit',event=>{
      event.preventDefault();const oldId=$('#sale-id').value;const old=oldId?data.sales.find(s=>s.id===oldId):null;const productId=$('#sale-product').value||null;const quantity=Math.max(1,Number($('#sale-quantity').value)||1);const product=productId?data.stock.find(p=>p.id===productId):null;const total=Number($('#sale-total').value);
      if(!$('#sale-customer').value.trim()||!Number.isFinite(total)||total<=0){announce('Informe cliente e valor válido para a venda.');return;}
      if(productId&&!product){announce('Esse item não existe mais no estoque. Selecione outro produto.');return;}
      if(product){const available=Number(product.quantity)+(old&&old.productId===productId?Number(old.quantity):0);if(quantity>available){announce(`Estoque insuficiente: há ${available} ${product.unit} disponíveis para este pedido.`);return;}}
      if(old?.productId){const oldProduct=data.stock.find(p=>p.id===old.productId);if(oldProduct)oldProduct.quantity+=Number(old.quantity)||0;}
      if(product)product.quantity-=quantity;
      const number=old?old.number:Math.max(0,...data.sales.map(s=>Number(s.number)||0))+1;
      const sale={id:oldId||id('sale'),number,customer:$('#sale-customer').value.trim(),date:$('#sale-date').value,channel:$('#sale-channel').value,fulfillment:$('#sale-fulfillment').value,productId,productName:product?.name||'',quantity,total,status:$('#sale-status').value,notes:$('#sale-notes').value.trim()};
      if(old){data.sales=data.sales.map(s=>s.id===oldId?sale:s);}else{data.sales.push(sale);}
      saleTransactions();save();closeDialog(saleDialog);renderSales();renderHome();renderStock();renderFinance();announce(old?'Venda atualizada.':'Venda registrada e estoque/financeiro atualizados.');
    });
    const editId=new URLSearchParams(location.search).get('edit');if(editId){const sale=data.sales.find(s=>s.id===editId);if(sale)openSaleForm(sale);}
  }
  function deleteSale(saleId){const sale=data.sales.find(s=>s.id===saleId);if(sale?.productId){const product=data.stock.find(p=>p.id===sale.productId);if(product)product.quantity+=Number(sale.quantity)||0;}data.sales=data.sales.filter(s=>s.id!==saleId);data.transactions=data.transactions.filter(t=>t.saleId!==saleId);save();renderStock();}
  // FINANCE PAGE
  const transactionDialog=$('#transaction-dialog');
  function resetTransactionForm(){ $('#transaction-form').reset();$('#transaction-id').value='';$('#transaction-form-title').textContent='Novo lançamento';$('#transaction-date').value=today();$('#transaction-type').disabled=false;$('#transaction-linked-hint').hidden=true;$('#transaction-form').querySelector('button[type="submit"]').disabled=false; }
  function openTransactionForm(txn=null){
    resetTransactionForm();
    if(txn){
      if(txn.saleId){const sale=data.sales.find(s=>s.id===txn.saleId);if(sale){location.href=`vendas.html?edit=${encodeURIComponent(sale.id)}`;return;}}
      $('#transaction-form-title').textContent='Editar lançamento';$('#transaction-id').value=txn.id;$('#transaction-date').value=txn.date;$('#transaction-type').value=txn.type;$('#transaction-category').value=txn.category;$('#transaction-amount').value=txn.amount;$('#transaction-description').value=txn.description;$('#transaction-status').value=txn.status;
    }
    transactionDialog.showModal();$('#transaction-description').focus();
  }
  function renderFinance(){
    const list=$('#finance-list');if(!list)return;
    const paid=data.transactions.filter(t=>t.status==='paid');const income=sum(paid.filter(t=>t.type==='income'),t=>t.amount);const expense=sum(paid.filter(t=>t.type==='expense'),t=>t.amount);const pending=sum(data.transactions.filter(t=>t.status==='pending'),t=>t.amount);
    $('#finance-income').textContent=money(income);$('#finance-expense').textContent=money(expense);$('#finance-balance').textContent=money(income-expense);$('#finance-pending').textContent=money(pending);
    const query=$('#finance-search').value.trim().toLocaleLowerCase('pt-BR');const type=$('#finance-type-filter').value;
    const filtered=[...data.transactions].sort((a,b)=>String(b.date).localeCompare(String(a.date))).filter(t=>`${t.description} ${t.category} ${t.type}`.toLocaleLowerCase('pt-BR').includes(query)&&(type==='all'||t.type===type));
    list.innerHTML=filtered.map(t=>{const linked=!!t.saleId;const sale=linked?data.sales.find(s=>s.id===t.saleId):null;const sign=t.type==='expense'?'−':(t.status==='paid'?'+':'');return `<article class="record"><div class="record-main"><div><div class="record-title">${escapeHTML(t.description)}</div><div class="record-subtitle">${escapeHTML(t.category)} · ${formatDate(t.date)}</div><span class="badge ${t.status==='paid'?'ok':''}">${t.status==='paid'?(t.type==='income'?'Recebido':'Pago'):'Pendente'}</span></div><div class="record-meta"><div class="record-amount">${sign} ${money(t.amount)}</div><div class="record-subtitle">${t.type==='income'?'Entrada':'Saída'}</div></div></div><div class="record-actions">${linked&&sale?`<a class="small-button" href="vendas.html?edit=${encodeURIComponent(sale.id)}">Editar venda</a><button type="button" class="small-button danger" data-action="delete-linked-sale" data-id="${escapeHTML(sale.id)}">Excluir venda</button>`:`<button type="button" class="small-button" data-action="edit-transaction" data-id="${escapeHTML(t.id)}">Editar</button><button type="button" class="small-button danger" data-action="delete-transaction" data-id="${escapeHTML(t.id)}">Excluir</button>`}</div></article>`;}).join('');
    $('#finance-empty').hidden=filtered.length>0;
  }
  function handleFinance(){
    $('#new-transaction').addEventListener('click',()=>openTransactionForm());$('#finance-search').addEventListener('input',renderFinance);$('#finance-type-filter').addEventListener('change',renderFinance);
    $('#finance-list').addEventListener('click',event=>{const btn=event.target.closest('button[data-action]');if(!btn)return;const txn=data.transactions.find(t=>t.id===btn.dataset.id);if(btn.dataset.action==='edit-transaction'&&txn)openTransactionForm(txn);if(btn.dataset.action==='delete-transaction'&&txn&&window.confirm(`Excluir o lançamento “${txn.description}”?`)){data.transactions=data.transactions.filter(t=>t.id!==txn.id);save();renderFinance();renderHome();announce('Lançamento excluído.');}if(btn.dataset.action==='delete-linked-sale'){const sale=data.sales.find(s=>s.id===btn.dataset.id);if(sale&&window.confirm(`Excluir a venda #${sale.number} e o lançamento financeiro relacionado?`)){deleteSale(sale.id);renderFinance();renderSales();renderHome();announce('Venda e lançamento vinculado excluídos.');}}});
    $('#transaction-form').addEventListener('submit',event=>{event.preventDefault();const idValue=$('#transaction-id').value;const amount=Number($('#transaction-amount').value);if(!$('#transaction-description').value.trim()||!$('#transaction-category').value.trim()||!Number.isFinite(amount)||amount<=0){announce('Preencha a descrição, categoria e um valor maior que zero.');return;}const obj={id:idValue||id('txn'),date:$('#transaction-date').value,type:$('#transaction-type').value,category:$('#transaction-category').value.trim(),description:$('#transaction-description').value.trim(),amount,status:$('#transaction-status').value,saleId:null};if(idValue){data.transactions=data.transactions.map(t=>t.id===idValue?obj:t);}else{data.transactions.push(obj);}save();closeDialog(transactionDialog);renderFinance();renderHome();announce(idValue?'Lançamento atualizado.':'Lançamento registrado.');});
    const exportButtons=[$('#export-data'),$('#export-data-secondary')].filter(Boolean);exportButtons.forEach(btn=>btn.addEventListener('click',exportBackup));
    $('#import-data').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());const imported=normalizeData(parsed);if(!window.confirm('Importar este backup substituirá os dados atuais neste navegador. Deseja continuar?')){event.target.value='';return;}data=imported;saleTransactions();save();renderFinance();renderHome();announce('Backup importado. Seus dados foram atualizados.');}catch(error){window.alert(`Não foi possível importar o backup: ${error.message}`);}finally{event.target.value='';}});
  }
  function exportBackup(){
    const payload={...data,exportedAt:new Date().toISOString(),format:'POPKOR backup v2'};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`popkor-backup-${today()}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);announce('Backup baixado. Guarde o arquivo em um lugar seguro.');
  }
  // Initialize application page.
  setupCommon();setupBrandName();saleTransactions();
  const currentPage=document.body.dataset.page;
  if(currentPage==='home')renderHome();
  if(currentPage==='stock'){handleStock();renderStock();}
  if(currentPage==='sales'){handleSales();renderSales();updateProductOptions();}
  if(currentPage==='finance'){handleFinance();renderFinance();}
})();
