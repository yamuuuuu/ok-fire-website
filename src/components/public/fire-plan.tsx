'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './fire-plan.module.css';

export function FirePlan() {
  const container = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    if (!container.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.25 });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return <figure ref={container} className={styles.card} aria-label="도면 위에 소방설비가 배치되는 개념 애니메이션">
    <div className={styles.heading}>
      <div><p className={styles.eyebrow}>현장 중심 소방 서비스</p><h2>공간에 맞춰,<br/>안전을 더합니다.</h2></div>
      <span className={styles.badge}>설비 배치 개념도</span>
    </div>
    <div key={replay} className={styles.drawing} data-playing={visible}>
      <svg viewBox="0 0 480 330" role="img" aria-label="공간 도면에 배관, 감지기, 스프링클러와 출입구 유도등이 차례로 나타납니다. 실제 설계도는 아닙니다.">
        <g stroke="#25354b" strokeWidth="1" fill="none" aria-hidden="true">
          {[40,80,120,160,200,240,280,320,360,400,440].map(x => <path key={`x${x}`} d={`M${x} 20V310`}/>)}
          {[30,70,110,150,190,230,270,310].map(y => <path key={`y${y}`} d={`M20 ${y}H460`}/>)}
        </g>
        <g fill="#142237" stroke="#8493a7" strokeWidth="3" strokeLinejoin="round">
          <rect x="55" y="55" width="370" height="220" stroke="none"/>
          <path d="M55 275V55H425V275H280M230 275H55" fill="none"/>
          <path d="M55 190H160M190 190H300M330 190H425M205 55V150M205 175V190M315 55V140M315 165V190" fill="none"/>
        </g>
        <g stroke="#63758d" strokeWidth="1" fill="none">
          <path d="M230 275V225A50 50 0 0 1 280 275M160 190V160A30 30 0 0 1 190 190"/>
          <path d="M55 35H425M55 30V40M425 30V40M35 55V275M30 55H40M30 275H40"/>
        </g>
        <g fill="#a8b6c9" fontSize="12" letterSpacing="2" textAnchor="middle">
          <text x="128" y="167">업무 공간</text><text x="260" y="167">회의실</text><text x="370" y="167">공용 공간</text><text x="370" y="255">복도</text>
        </g>
        <g className={styles.pipes} stroke="#fb7185" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path pathLength="1" d="M80 250V215H400V105H350M260 215V105M125 215V105"/>
        </g>
        <g className={styles.equipment}>
          {[[125,105],[260,105],[350,105],[400,215]].map(([x,y]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <circle r="12" fill="#18273c" stroke="#fb7185" strokeWidth="2"/>
            <path d="M-6 0H6M0-6V6" stroke="#fb7185" strokeWidth="2"/>
            <circle r="3" fill="#fb7185"/>
          </g>)}
          {[[165,132],[283,132],[390,132],[125,244]].map(([x,y]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <circle r="12" fill="#18273c" stroke="#7dd3fc" strokeWidth="2"/>
            <circle r="5" fill="none" stroke="#7dd3fc" strokeWidth="1.5"/>
            <circle r="1.5" fill="#7dd3fc"/>
          </g>)}
        </g>
        <g className={styles.exit}>
          <rect x="233" y="263" width="44" height="24" rx="4" fill="#153d38" stroke="#6ee7b7" strokeWidth="2"/>
          <text x="255" y="279" textAnchor="middle" fill="#a7f3d0" fontSize="11" fontWeight="700">유도등</text>
          <path d="M255 298V313M250 308L255 313L260 308" fill="none" stroke="#6ee7b7" strokeWidth="1.5"/>
        </g>
      </svg>
    </div>
    <div className={styles.legend} aria-label="설비 기호 안내">
      <span><i className={styles.detector}/>감지기</span><span><i className={styles.sprinkler}/>스프링클러·배관</span><span><i className={styles.guide}/>유도등</span>
    </div>
    <figcaption className={styles.caption}><p>이해를 돕기 위한 개념도입니다.<br/>실제 설비의 종류와 위치는 현장 조건에 따라 달라집니다.</p><button type="button" onClick={() => { setVisible(true); setReplay(value => value + 1); }} aria-label="설비 배치 애니메이션 다시 보기"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg>다시 보기</button></figcaption>
  </figure>;
}
