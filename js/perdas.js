import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient("https://szzfqkhibuejhodhkvjj.supabase.co", "sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_")

// NAVEGAÇÃO
window.sair = () => window.location.href = "index_menu.html"

window.abrirRegistros = () => {
  document.getElementById("modalRegistros").style.display = "block";
  listar();
}

window.fecharRegistros = () => {
  document.getElementById("modalRegistros").style.display = "none";
}

// ENTER
document.addEventListener("keydown", e=>{
  if(e.key==="Enter"){
    e.preventDefault();
    let inputs=[...document.querySelectorAll("input")];
    let i=inputs.indexOf(document.activeElement);
    if(i>=0 && i<inputs.length-1) inputs[i+1].focus();
  }
});

// TOTAL
function calc(d){
  return Number(d.tocos||0)+Number(d.pontas||0)+Number(d.lascas||0)+
         Number(d.pedacos||0)+Number(d.inteiras||0)+
         Number(d.toletes||0)+Number(d.palmitos||0);
}

// SALVAR
window.salvar = async ()=>{
  try{

    let d={
      data:data.value,
      liberacao:liberacao.value,
      lote:lote.value,
      quadra:quadra.value,
      equipamento:equipamento.value,
      operador:operador.value,
      tocos:tocos.value,
      pontas:pontas.value,
      lascas:lascas.value,
      pedacos:pedacos.value,
      inteiras:inteiras.value,
      toletes:toletes.value,
      palmitos:palmitos.value,
      observacao:observacao.value
    };

    d.total = calc(d);

    let {error} = await supabase.from('perdas_cana').insert([d]);
    if(error) throw error;

    alert("Salvo!");
    limpar();

  }catch(e){
    alert(e.message);
  }
}

// LISTAR
async function listar(filtro={}){

  let query = supabase.from('perdas_cana').select('*');

  if(filtro.equipamento)
    query = query.ilike('equipamento', `%${filtro.equipamento}%`);

  if(filtro.lote)
    query = query.ilike('lote', `%${filtro.lote}%`);

  if(filtro.operador)
    query = query.ilike('operador', `%${filtro.operador}%`);

  let {data, error} = await query;

  if(error) return alert(error.message);

  tabela.innerHTML="";
  let total=0;

  data.forEach(i=>{
    total+=Number(i.total||0);

    tabela.innerHTML+=`
    <tr>
      <td>${i.data}</td>
      <td>${i.equipamento}</td>
      <td>${i.lote}</td>
      <td>${i.operador}</td>
      <td>${i.total}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="editar(${i.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="excluir(${i.id})">🗑️</button>
      </td>
    </tr>`;
  });

  totalGeral.innerText = total.toFixed(3);
}

// FILTRO
window.filtrar = ()=>{
  listar({
    equipamento:fEquipamento.value,
    lote:fLote.value,
    operador:fOperador.value
  });
}

window.limparFiltro = ()=>{
  fEquipamento.value="";
  fLote.value="";
  fOperador.value="";
  listar();
}

// EXCLUIR
window.excluir = async(id)=>{
  if(!confirm("Excluir registro?")) return;

  await supabase.from('perdas_cana').delete().eq('id',id);
  listar();
}

// EDITAR (carrega no formulário)
window.editar = async(id)=>{
  let {data} = await supabase.from('perdas_cana').select('*').eq('id',id).single();

  Object.keys(data).forEach(k=>{
    if(document.getElementById(k)){
      document.getElementById(k).value = data[k];
    }
  });

  fecharRegistros();
}

// LIMPAR
window.limpar = ()=> document.querySelectorAll("input").forEach(i=>i.value="");

// MOSTRAR REGISTROS
window.abrirRegistros = () => {
  document.getElementById("formulario").style.display = "none";
  document.getElementById("registros").style.display = "block";
  listar();
};

// VOLTAR PARA FORM
window.fecharRegistros = () => {
  document.getElementById("registros").style.display = "none";
  document.getElementById("formulario").style.display = "block";
};

window.abrirRegistros = () => {
  formulario.style.display = "none";
  registros.style.display = "block";
  listar();
};

window.fecharRegistros = () => {
  registros.style.display = "none";
  formulario.style.display = "block";
};