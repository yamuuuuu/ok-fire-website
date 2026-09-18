import Image from 'next/image';

export function BrandLogo({ priority = false, large = false }: { priority?: boolean; large?: boolean }) {
  return <span className="inline-flex flex-col items-start">
    <span className={`relative block overflow-hidden ${large ? 'h-14 w-[155px]' : 'h-11 w-[122px] sm:h-12 sm:w-[133px]'}`}>
      <Image
        src="/okfire-logo.png"
        alt="OK소방"
        width={large ? 190 : 170}
        height={large ? 69 : 61}
        priority={priority}
        className="h-full w-full"
      />
      <span aria-hidden="true" className="absolute right-0 bottom-[4%] h-[21%] w-[68%] bg-white"/>
    </span>
    <span className={`mt-1 font-extrabold tracking-tight text-slate-700 ${large ? 'text-xs' : 'text-[11px] sm:text-xs'}`}>
      30년, 더 안전한 오늘을 만듭니다
    </span>
  </span>;
}
