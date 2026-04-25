import zipfile
import xml.etree.ElementTree as ET

def extract_text(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            text = '\n'.join([node.text for node in root.findall('.//w:t', ns) if node.text])
            print(text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    extract_text('Mise_PRD.docx')
