// ==========================================
// MOTOR VISUAL: Lector y Dibujante de PDFs
// ==========================================
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

async function dibujarPDFenLienzo(archivo) {
    if (archivo.type !== "application/pdf") {
        document.getElementById('lienzo-espacio')?.classList.add('oculto');
        return;
    }
    const fileReader = new FileReader();
    fileReader.onload = async function(e) {
        const typedarray = new Uint8Array(e.target.result);
        try {
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            const grid = document.getElementById('pdf-grid');
            grid.innerHTML = ''; 
            document.getElementById('lienzo-espacio').classList.remove('oculto');

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 }); 
                const divContenedor = document.createElement('div');
                divContenedor.className = 'pagina-pdf';
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const etiquetaNumero = document.createElement('span');
                etiquetaNumero.className = 'numero-pagina';
                etiquetaNumero.textContent = `Página ${pageNum}`;
                divContenedor.appendChild(canvas);
                divContenedor.appendChild(etiquetaNumero);
                grid.appendChild(divContenedor);
            }
        } catch (error) {
            console.error("Error al leer el PDF:", error);
        }
    };
    fileReader.readAsArrayBuffer(archivo);
}

// ==========================================
// CONTROLADOR PRINCIPAL DE MOYXYOM PRO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Configuración de Variables
    const API_URL = "https://moyxyom-backend-production.up.railway.app/process";
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const processBtn = document.getElementById('process-btn');
    const statusDiv = document.getElementById('status');
    const toolBtns = document.querySelectorAll('.tool-btn, .tool-btnacc');
    const currentActionText = document.getElementById('current-action-text');
    const vipInput = document.getElementById('vip-key');

    let archivosSeleccionados = [];
    let accionActual = "pdf-to-docx"; 

    // 2. Cargar Llave VIP guardada
    if (vipInput) {
        const llaveGuardada = localStorage.getItem('mi_llave_moyxyom');
        if (llaveGuardada) vipInput.value = llaveGuardada;

        vipInput.addEventListener('input', () => {
            localStorage.setItem('mi_llave_moyxyom', vipInput.value);
        });
    }

    // 3. Menú de Herramientas
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.tool-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            accionActual = btn.dataset.action;
            currentActionText.innerText = btn.innerText;
            archivosSeleccionados = [];
            actualizarInterfaz();
        });
    });

    // 4. Manejo de Archivos
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => manejarArchivos(e.target.files));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragging'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragging');
        manejarArchivos(e.dataTransfer.files);
    });

    function manejarArchivos(files) {
        if (!files.length) return;
        const nuevosArchivos = Array.from(files);
        if (accionActual === "merge") {
            archivosSeleccionados = [...archivosSeleccionados, ...nuevosArchivos];
        } else {
            archivosSeleccionados = [nuevosArchivos[0]];
        }
        actualizarInterfaz();
        if (archivosSeleccionados.length > 0) {
            dibujarPDFenLienzo(archivosSeleccionados[0]);
        }
    }

    function actualizarInterfaz() {
        fileList.innerHTML = "";
        if (archivosSeleccionados.length > 0) {
            archivosSeleccionados.forEach(file => {
                const item = document.createElement('div');
                item.classList.add('file-item');
                item.innerText = `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                fileList.appendChild(item);
            });
            processBtn.disabled = (accionActual === "merge" && archivosSeleccionados.length < 2);
            statusDiv.innerText = processBtn.disabled ? "⚠️ Sube al menos 2 PDFs" : "¡Listo para procesar!";
            dropZone.querySelector('.drop-content').style.display = 'none';
        } else {
            processBtn.disabled = true;
            statusDiv.innerText = "Esperando archivo...";
            dropZone.querySelector('.drop-content').style.display = 'block';
            document.getElementById('lienzo-espacio')?.classList.add('oculto');
        }
    }

    // 5. ENVÍO AL CEREBRO (RAILWAY)
    processBtn.addEventListener('click', async () => {
        if (archivosSeleccionados.length === 0) return;

        const formData = new FormData();
        archivosSeleccionados.forEach(file => formData.append('files', file));
        formData.append('action', accionActual);
        if (vipInput.value) formData.append('vip_key', vipInput.value);

        statusDiv.innerText = `⏳ MOYXYOM Pro trabajando...`;
        statusDiv.style.color = "#fbbf24"; 
        processBtn.disabled = true;

        try {
            const respuesta = await fetch(API_URL, { 
                method: 'POST', 
                body: formData
                // No ponemos cabeceras manuales, Fetch las pone solo para FormData
            });

            if (!respuesta.ok) {
                const errorData = await respuesta.json();
                throw new Error(errorData.detail || "Error en el servidor");
            }

            const masaDeDatos = await respuesta.blob();
            let nombreBase = archivosSeleccionados[0].name.split('.')[0]; 
            let nombreFinal = `MOYXYOM_${accionActual}_${nombreBase}`;
            
            // Extensiones inteligentes
            const extMap = {
                "pdf-to-docx": ".docx",
                "merge": ".pdf",
                "ocr": "_texto.txt",
                "extract-images": "_imagenes.zip",
                "split": "_paginas.zip"
            };
            nombreFinal += (extMap[accionActual] || ".pdf");

            const linkInvisible = document.createElement('a');
            linkInvisible.href = window.URL.createObjectURL(masaDeDatos);
            linkInvisible.download = nombreFinal;
            linkInvisible.click();

            statusDiv.innerText = `✅ ¡Completado!`;
            statusDiv.style.color = "#10b981";

        } catch (error) {
            console.error("Error detallado:", error);
            statusDiv.innerText = `❌ Error: ${error.message}`;
            statusDiv.style.color = "#ef4444";
        } finally {
            processBtn.disabled = false;
        }
    });
});
