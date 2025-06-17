from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image, ImageOps
import logging
from io import BytesIO
from fastapi.responses import StreamingResponse  
app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🔍 Lógica para extraer campos automáticamente del texto completo
def extraer_emisor_destinatario(texto: str):
    lineas = texto.splitlines()
    emisor = ""
    destinatario = ""
    capturando_destinatario = False
    bloque_destinatario = []

    for i, linea in enumerate(lineas):
        if "Señores" in linea:
            capturando_destinatario = True

        if capturando_destinatario:
            if linea.strip() == "":
                continue
            bloque_destinatario.append(linea.strip())
            if "Referencia" in linea or "Asunto" in linea:
                break

    destinatario = "\n".join(bloque_destinatario).strip()

    for i, linea in enumerate(lineas):
        if "Atentamente" in linea:
            posibles_lineas_emisor = lineas[i+1:i+5]
            emisor = "\n".join([l.strip() for l in posibles_lineas_emisor if l.strip()])
            break

    return emisor, destinatario

@app.post("/pdf-to-image/")
async def pdf_to_image(file: UploadFile = File(...), page: int = Form(...)):
    pdf_bytes = await file.read()
    images = convert_from_bytes(pdf_bytes, dpi=300)
    if page < 1 or page > len(images):
        return {"error": "Página inválida"}

    image = images[page - 1]

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="image/png")
# 🧠 Endpoint completo (todo el documento)
@app.post("/ocr/pdf/")
async def extract_text_from_pdf(file: UploadFile = File(...)):
    try:
        pdf_bytes = await file.read()
        images = convert_from_bytes(pdf_bytes, dpi=300)

        full_text = ""

        for i, image in enumerate(images):
            gray = image.convert("L")
            enhanced = ImageOps.autocontrast(gray)

            text = pytesseract.image_to_string(enhanced, lang="spa")
            full_text += f"\n\n--- Página {i+1} ---\n{text}"

        emisor, destinatario = extraer_emisor_destinatario(full_text)

        return {
            "texto_extraido": full_text.strip(),
            "emisor": emisor,
            "destinatario": destinatario
        }

    except pytesseract.TesseractNotFoundError:
        return JSONResponse(status_code=500, content={"error": "Tesseract no está instalado o no está en el PATH."})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/ocr/pdf/region/")
async def extract_region_text_from_pdf(
    file: UploadFile = File(...),
    page: float = Form(...),
    x: float = Form(...),
    y: float = Form(...),
    width: float = Form(...),
    height: float = Form(...)
):
    try:
        logger.info(f"📝 Recibido archivo: {file.filename}")
        logger.info(f"📄 Página: {page}, Región: x={x}, y={y}, width={width}, height={height}")

        pdf_bytes = await file.read()
        logger.info(f"📦 Bytes del PDF recibidos: {len(pdf_bytes)} bytes")

        images = convert_from_bytes(pdf_bytes, dpi=300)
        logger.info(f"📷 Páginas convertidas: {len(images)}")

        if page < 1 or page > len(images):
            logger.error("❌ Número de página inválido")
            return JSONResponse(status_code=400, content={"error": "Número de página inválido"})

        image = images[int(page) - 1].convert("L")
        enhanced = ImageOps.autocontrast(image)
        if width <= 0 or height <= 0:
            logger.error("❌ La región seleccionada tiene ancho o alto igual o menor que cero.")
            return JSONResponse(status_code=400, content={"error": "La región seleccionada es inválida (ancho/alto no puede ser cero)."})

        cropped = enhanced.crop((int(x), int(y), int(x + width), int(y + height)))
        logger.info("✂️ Región recortada con éxito")

        text = pytesseract.image_to_string(cropped, lang="spa")
        logger.info("✅ OCR realizado exitosamente")

        return {"texto_extraido": text.strip()}

    except Exception as e:
        logger.exception("💥 Error durante el procesamiento del OCR por región")
        return JSONResponse(status_code=500, content={"error": str(e)})
