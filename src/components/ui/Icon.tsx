import type { SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'compare'
  | 'filter'
  | 'menu'
  | 'minus'
  | 'plus'
  | 'spark';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...props }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    'arrow-left': <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    'arrow-right': <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    'arrow-up-right': <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    compare: <><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" /></>,
    filter: <><path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    minus: <path d="M5 12h14" />,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    spark: <><path d="m12 3-1.8 5.2L5 10l5.2 1.8L12 17l1.8-5.2L19 10l-5.2-1.8L12 3Z" /><path d="m5 3-.7 2.3L2 6l2.3.7L5 9l.7-2.3L8 6l-2.3-.7L5 3Z" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
