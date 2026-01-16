import si from 'systeminformation';

/**
 * Get real PC specifications
 * @returns {Promise<Object>} PC specifications
 */
export async function getPCSpecs() {
    try {
        const [cpu, graphics, mem] = await Promise.all([
            si.cpu(),
            si.graphics(),
            si.mem()
        ]);

        // Get primary GPU
        const primaryGPU = graphics.controllers && graphics.controllers.length > 0
            ? graphics.controllers[0]
            : null;

        // Format RAM size
        const ramGB = Math.round(mem.total / (1024 ** 3));

        // Get RAM speed if available
        const memLayout = await si.memLayout();
        const ramSpeed = memLayout && memLayout.length > 0 && memLayout[0].clockSpeed
            ? `${memLayout[0].clockSpeed}MHz`
            : '';

        return {
            cpu: cpu.brand || 'Unknown CPU',
            gpu: primaryGPU ? primaryGPU.model : 'Unknown GPU',
            ram: ramSpeed ? `${ramGB}GB ${ramSpeed}` : `${ramGB}GB`
        };
    } catch (error) {
        console.error('Error fetching PC specs:', error);
        return {
            cpu: 'Unable to detect',
            gpu: 'Unable to detect',
            ram: 'Unable to detect'
        };
    }
}
