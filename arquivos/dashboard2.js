const supabase = window.supabaseClient;

document.addEventListener("DOMContentLoaded",()=>{
    verificarLogin();
    carregarUsuario();
    carregarCards();
    aplicarTema();
});

async function verificarLogin(){
    const { data:{ user } } = await supabase.auth.getUser();
    if(!user) window.location.href="login.html";
}

async function carregarUsuario(){
    const { data:{ user } } = await supabase.auth.getUser();

    document.getElementById("userName").innerText = user.email;

    if(user.user_metadata?.avatar_url){
        document.getElementById("userPhoto").src =
        user.user_metadata.avatar_url;
    }else{
        document.getElementById("userPhoto").src =
        "https://via.placeholder.com/35";
    }
}

async function carregarCards(){

    const hoje = new Date().toISOString().split("T")[0];

    const { count:colab } = await supabase
        .from("colaboradores")
        .select("*",{count:"exact",head:true});

    const { count:equip } = await supabase
        .from("equipamentos")
        .select("*",{count:"exact",head:true});

    const { count:pontos } = await supabase
        .from("ponto_digital")
        .select("*",{count:"exact",head:true})
        .eq("data_lancamento",hoje);

    const { count:apont } = await supabase
        .from("apontamentos")
        .select("*",{count:"exact",head:true})
        .eq("data_lancamento",hoje);

    document.getElementById("totalColaboradores").innerText = colab || 0;
    document.getElementById("totalEquipamentos").innerText = equip || 0;
    document.getElementById("pontosHoje").innerText = pontos || 0;
    document.getElementById("apontamentosHoje").innerText = apont || 0;
}

function logout(){
    supabase.auth.signOut();
    window.location.href="login.html";
}

function toggleSidebar(){
    document.querySelector(".sidebar").classList.toggle("closed");
    document.querySelector(".main").classList.toggle("closed");
}

const themeIcon = document.getElementById("themeIcon");

themeIcon.addEventListener("click",()=>{
    const body = document.body;

    if(body.classList.contains("light")){
        body.classList.remove("light");
        body.classList.add("dark");
        themeIcon.className="bi bi-moon-fill theme-toggle";
        localStorage.setItem("tema","dark");
    }else{
        body.classList.remove("dark");
        body.classList.add("light");
        themeIcon.className="bi bi-brightness-high-fill theme-toggle";
        localStorage.setItem("tema","light");
    }
});

function aplicarTema(){
    const tema = localStorage.getItem("tema");
    if(tema==="dark"){
        document.body.classList.remove("light");
        document.body.classList.add("dark");
        themeIcon.className="bi bi-moon-fill theme-toggle";
    }
}