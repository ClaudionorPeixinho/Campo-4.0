document.addEventListener("DOMContentLoaded", async () => {

  const btnRegistrar = document.getElementById("btnRegistrar");
  const btnLogin = document.getElementById("btnLogin");
  const msg = document.getElementById("mensagem");

  // Se já estiver logado
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = "index_menu.html";
    return;
  }

  btnRegistrar.addEventListener("click", async () => {

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    msg.innerText = "";
    msg.classList.remove("text-success");
    msg.classList.add("text-danger");

    if (!nome || !email || !senha) {
      msg.innerText = "Preencha todos os campos para cadastro.";
      return;
    }

    // 1️⃣ Cria usuário no Auth
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: senha
    });

    if (error) {
      msg.innerText = error.message;
      return;
    }

    // 2️⃣ Salva na tabela publica usuarios
    const { error: erroTabela } = await supabaseClient
      .from("usuarios")
      .insert([{
        id: data.user.id,
        nome: nome,
        email: email
      }]);

    if (erroTabela) {
      msg.innerText = erroTabela.message;
    } else {
      msg.classList.remove("text-danger");
      msg.classList.add("text-success");
      msg.innerText = "Usuário cadastrado com sucesso!";
    }
  });

  btnLogin.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    msg.innerText = "";
    msg.classList.remove("text-success");
    msg.classList.add("text-danger");

    if (!email || !senha) {
      msg.innerText = "Informe email e senha.";
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: senha
    });

    if (error) {
      msg.innerText = error.message;
    } else {
      window.location.href = "index_menu.html";
    }
  });

});

document.getElementById("recuperarSenha")
.addEventListener("click", async () => {

  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Digite seu email para recuperar a senha.");
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

  if (error) {
    alert(error.message);
  } else {
    alert("Email de recuperação enviado.");
  }

});