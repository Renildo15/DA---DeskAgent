<script lang="ts">
	import { onMount } from "svelte";
    // TODO: FEEDBACK NO APP
    // TODO: ESCOLHER TEMPO PARA DESLIGAR PC
    // TODO: CRIAR PWA
    // TODO: ADICONAR MAIS COMANDOS
    let status: "online" | "offline" = "offline"
    let lastPing = Date.now()
    let ws:WebSocket;

    let command;
    onMount(() => {
        ws = new WebSocket("ws://127.0.0.1:8000/ws/control/")
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.type === "status") {
                lastPing = Date.now();
                status = "online";
            }
        };

        setInterval(() => {
            if (Date.now() - lastPing > 10000) {
                status = "offline";
            }
        }, 1000)
    })


    const handleCommand = (command_text: string) => {
        command = command_text
        ws.send(JSON.stringify({type: "command", role: "app", action: command}))
    }

</script>

<main class="app">
  <section class="card">

    <header class="status">
        <span class="dot {status}"></span>
        <span>PC {status === "online" ? "Online" : "Offline"}</span>
    </header>

    <div class="actions">
      <button onclick={() => handleCommand("shutdown")} class="danger">Desligar</button>
      <button onclick={() => handleCommand("reboot")} class="warning">Reiniciar</button>
      <button onclick={() => handleCommand("suspend")} >Suspender</button>
      <button onclick={() => handleCommand("shutdown_with_time")} class="secondary">Desligar em X minutos</button>
    </div>

  </section>
</main>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .app {
        min-height: 100vh;
        background: #0b0f19;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 20px;
        color: #fff;
    }

    .card {
        width: 100%;
        max-width: 420px;
        background: #121826;
        border-radius: 20px;
        padding: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }

        /* STATUS */

    .status {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        margin-bottom: 20px;
    }

    .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }

    .dot.online {
        background: #22c55e;
        box-shadow: 0 0 8px #22c55e;
    }

    .dot.offline {
        background: #ef4444;
    }

     /* BUTTONS */

    .actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    button {
        padding: 18px;
        font-size: 18px;
        border-radius: 14px;
        border: none;
        background: #1f2937;
        color: white;
        cursor: pointer;
        transition: transform 0.05s ease, background 0.2s;
    }

    button:active {
        transform: scale(0.98);
    }

        /* VARIAÇÕES */

    button.danger {
        background: #dc2626;
    }

    button.warning {
        background: #d97706;
    }

    button.secondary {
        background: #334155;
    }

</style>