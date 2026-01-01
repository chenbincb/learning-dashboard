import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * 将指定的 DOM 元素导出为 PDF 报告
 * 使用“影子渲染”技术：在离屏隐藏容器中克隆并渲染节点，确保排版不受当前窗口限制。
 * @param elementId 要导出的容器 ID
 * @param fileName 导出的文件名
 */
export const exportDashboardByElementId = async (elementId: string, fileName: string = '诊断报告.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // 1. 创建离屏隐藏容器
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1280px';
    container.style.backgroundColor = '#e2e8f0';
    document.body.appendChild(container);

    // 2. 克隆节点并强制样式
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '1280px';
    clone.style.maxWidth = 'none';
    clone.style.margin = '0';
    clone.style.padding = '40px';
    clone.style.backgroundColor = '#e2e8f0';

    // 递归移除克隆节点及其子节点的所有响应式宽度限制 (max-w, mx-auto)
    const cleanLayout = (node: HTMLElement) => {
        if (!node.classList) return;
        node.classList.remove('max-w-7xl', 'max-w-6xl', 'max-w-5xl', 'max-w-screen-xl', 'mx-auto', 'dark');
        if (node.style) {
            node.style.maxWidth = 'none';
        }
        Array.from(node.children).forEach(child => cleanLayout(child as HTMLElement));
    };
    cleanLayout(clone);

    // 强制内部 Grid 保持三栏布局
    clone.querySelectorAll('.grid').forEach(grid => {
        if (grid instanceof HTMLElement) {
            if (grid.classList.contains('md:grid-cols-3') || grid.classList.contains('lg:grid-cols-3')) {
                grid.classList.remove('md:grid-cols-3', 'lg:grid-cols-3', 'grid-cols-1', 'grid-cols-2');
                grid.classList.add('grid-cols-3');
                grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
                grid.style.width = '100%';
            }
        }
    });

    container.appendChild(clone);

    try {
        // 4. 执行高清图像合成
        const dataUrl = await toJpeg(clone, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: '#e2e8f0',
            // 过滤不需要的交互元素
            filter: (node) => {
                if (node instanceof HTMLElement && node.classList.contains('no-print')) {
                    return false;
                }
                return true;
            },
        });

        // 5. 生成 PDF（自适应比例的单页 PDF）
        const tempPdf = new jsPDF();
        const imgProps = tempPdf.getImageProperties(dataUrl);
        const pdfWidth = 210;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
        });

        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(fileName);
    } catch (error) {
        console.error('PDF Export Error:', error);
    } finally {
        // 6. 清理隐藏容器
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};
