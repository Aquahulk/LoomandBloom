import Image from 'next/image';

export default function OrdersDecor() {
  return (
    <div aria-hidden className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Bottom-left corner plant anchored to viewport, full image darker */}
      <div className="fixed bottom-2 left-2 sm:bottom-4 sm:left-4 hidden sm:block w-40 sm:w-48 md:w-60 lg:w-72">
        <Image
          src="/plant-left.png"
          alt=""
          width={300}
          height={300}
          className="w-full h-auto select-none opacity-0"
          style={{ filter: 'brightness(0.6) contrast(1.05) saturate(1.05)' }}
          priority
        />
      </div>

      {/* Bottom-right corner palm anchored to viewport, full image darker */}
      <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 hidden sm:block w-40 sm:w-48 md:w-60 lg:w-80">
        <Image
          src="/palm-right.png"
          alt=""
          width={320}
          height={320}
          className="w-full h-auto select-none opacity-0"
          style={{ filter: 'brightness(0.6) contrast(1.05) saturate(1.05)' }}
          priority
        />
      </div>

      {/* Top-right hanging plant, full image darker */}
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 hidden sm:block w-32 sm:w-40 md:w-48 lg:w-56">
        <Image
          src="/hanging-top-right.png"
          alt=""
          width={240}
          height={240}
          className="w-full h-auto select-none opacity-0"
          style={{ filter: 'brightness(0.6) contrast(1.05) saturate(1.05)' }}
          priority
        />
      </div>

      {/* Bottom fern across width, centered, full image darker */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 hidden sm:block">
        <Image
          src="/fern-bottom.png"
          alt=""
          width={1200}
          height={260}
          className="select-none opacity-0"
          style={{ width: '1200px', maxWidth: '100vw', filter: 'brightness(0.55) contrast(1.05) saturate(1.05)' }}
          priority 
        /> 
      </div>
    </div> 
  );
}