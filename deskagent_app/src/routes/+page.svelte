<script lang="ts">
	import { onMount } from "svelte";
    // TODO: ESCOLHER TEMPO PARA DESLIGAR PC
    // TODO: CRIAR PWA
    // TODO: ADICONAR MAIS COMANDOS
    let status: "online" | "offline" = "offline"
    let toastMessage = "";
    let toastType: "success" | "error" | "info" = "info";
    let lastPing = Date.now()
    let ws:WebSocket;

    let cooldown = false;
    let cooldownTime = 0;
    let cooldownInterval: any;

    const startCooldown = (seconds: number) => {
        cooldown = true;
        cooldownTime = seconds;

        clearInterval(cooldownInterval);

        cooldownInterval = setInterval(() => {
            cooldownTime--;

            if (cooldownTime <= 0) {
                cooldown = false;
                clearInterval(cooldownInterval);
            }
        }, 1000);
    };


    let logs: {
        level: string;
        message: string;
        timestamp: number;
    }[] = [];


    onMount(() => {
        ws = new WebSocket("ws://127.0.0.1:8000/ws/control/")

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: "hello",
                role: "app"
            }))
        }
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.type === "status") {
                lastPing = Date.now();
                status = "online";
            }

            if (data.type === "feedback") {
                toastMessage = data.message;
                toastType = data.status;
                setTimeout(() => toastMessage = "", 3000);
            }

            if (data.type === "log") {
                logs = [data, ...logs].slice(0, 50);
            }
        };


        setInterval(() => {
            if (Date.now() - lastPing > 10000) {
                status = "offline";
            }
        }, 1000)
    })


    const sendCommand = (action: string, payload = {}) => {
		ws.send(JSON.stringify({
			type: "command",
			role: "app",
			action,
			...payload
		}))
	}

	const confirmShutdownWithTime = () => {
		sendCommand("shutdown_with_time", { minutes })
		showModal = false
	}
    

    let showModal = false;
	let minutes = 10;

    const sendWithCooldown = (action: string, seconds = 3, payload = {}) => {
        sendCommand(action, payload);
        startCooldown(seconds);
    };



</script>

<main class="app">
    <section class="card">

        <header class="status">
            <span class="dot {status}"></span>
            <span>PC {status === "online" ? "Online" : "Offline"}</span>
        </header>

        <div class="actions">
            <button
                disabled={status === "offline" || cooldown}
                style="opacity: {status === 'offline' || cooldown ? '0.5' : '1'}"
                onclick={() => sendWithCooldown("shutdown", 3)}
                class="danger"
            >
                {cooldown ? `Aguarde ${cooldownTime}s` : "Desligar"}
            </button>

            <button
                disabled={status === "offline" || cooldown}
                style="opacity: {status === 'offline' || cooldown ? '0.5' : '1'}"
                onclick={() => sendWithCooldown("reboot", 3)}
                class="warning"
            >
                Reiniciar
            </button>

            <button
                disabled={status === "offline" || cooldown}
                style="opacity: {status === 'offline' || cooldown ? '0.5' : '1'}"
                onclick={() => sendWithCooldown("suspend", 3)}
            >
                Suspender
            </button>

            <button
                disabled={status === "offline" || cooldown}
                style="opacity: {status === 'offline' || cooldown ? '0.5' : '1'}"
                onclick={() => showModal = true}
                class="secondary"
            >
                Desligar em X minutos
            </button>

            <button
                disabled={status === "offline" || cooldown}
                style="opacity: {status === 'offline' || cooldown ? '0.5' : '1'}"
                onclick={() => sendWithCooldown("ping", 2)}
            >
                Ping
            </button>

            {#if showModal}
                <div class="modal-backdrop" role="button" tabindex="0" onclick={() => showModal = false} onkeydown={(e) => e.key === "Escape" && (showModal = false)}>
                    <div class="modal">
                        <h2>⏱️ Desligar PC</h2>

                        <p>Tempo até desligar:</p>
                        <strong>{minutes} minutos</strong>

                        <input
                            type="range"
                            min="1"
                            max="120"
                            bind:value={minutes}
                        />

                        <div class="modal-actions">
                            <button type="button" class="secondary" onclick={() => showModal = false}>
                                Cancelar
                            </button>
                            <button class="danger" onclick={confirmShutdownWithTime}>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

        </div>
        
        {#if toastMessage}
            <div class="toast {toastType}">
                {toastMessage}
            </div>
        {/if}
    </section>
    <section class="logs">
        <h3>📜 Logs</h3>

        {#each logs as log}
            <div class="log {log.level}">
                <span>{new Date(log.timestamp * 1000).toLocaleTimeString()}</span>
                <span>{log.message}</span>
            </div>
        {/each}
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
        display: flex;
        flex-direction: column;
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

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }   

    /* MODAL */

    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: flex-end;
        padding: 20px;
        z-index: 100;
    }

    .modal {
        width: 100%;
        max-width: 420px;
        background: #121826;
        border-radius: 20px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        animation: slideUp 0.2s ease-out;
    }

    .modal h2 {
        font-size: 20px;
    }

    .modal strong {
        font-size: 22px;
        text-align: center;
    }

    .modal input[type="range"] {
        width: 100%;
    }

    .modal-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }

    .modal-actions button {
        flex: 1;
    }

    /* ANIMAÇÃO */

    @keyframes slideUp {
        from {
            transform: translateY(40px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 14px 20px;
        border-radius: 14px;
        color: white;
        font-size: 16px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        z-index: 200;
    }

    .toast.success { background: #16a34a; }
    .toast.error   { background: #dc2626; }
    .toast.info    { background: #2563eb; }

    .logs {
        margin-top: 20px;
        background: #0f172a;
        border-radius: 14px;
        padding: 12px;
        width: 100%;
        overflow-y: auto;
    }

    .log {
        font-size: 14px;
        display: flex;
        gap: 8px;
        margin-bottom: 6px;
    }

    .log.success { color: #22c55e; }
    .log.error   { color: #ef4444; }
    .log.info    { color: #60a5fa; }
    .log.warning { color: #facc15; }


</style>