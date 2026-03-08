/**
 * SVG Icon library for CaSiCaS.
 * All icons are inline SVGs — no external dependencies.
 * Usage: <Icon.MapPin size={24} />
 */

const defaultProps = { size: 24, color: 'currentColor', strokeWidth: 1.8 };

const wrap = (path, props = {}) => {
    const { size, color, strokeWidth, className, style, ...rest } = { ...defaultProps, ...props };
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={style}
            {...rest}
        >
            {path}
        </svg>
    );
};

// ===== Navigation & UI =====

export const MapPin = (props) => wrap(
    <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </>,
    props
);

export const Map = (props) => wrap(
    <>
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
    </>,
    props
);

export const Users = (props) => wrap(
    <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>,
    props
);

export const Search = (props) => wrap(
    <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>,
    props
);

export const Play = (props) => wrap(
    <polygon points="5 3 19 12 5 21 5 3" />,
    props
);

export const ChevronDown = (props) => wrap(
    <polyline points="6 9 12 15 18 9" />,
    props
);

export const Plus = (props) => wrap(
    <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </>,
    props
);

export const X = (props) => wrap(
    <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </>,
    props
);

export const Edit = (props) => wrap(
    <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>,
    props
);

export const Trash = (props) => wrap(
    <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>,
    props
);

// ===== Auth & Dashboard =====

export const ShoppingCart = (props) => wrap(
    <>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </>,
    props
);

export const DollarSign = (props) => wrap(
    <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>,
    props
);

export const Tag = (props) => wrap(
    <>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
    </>,
    props
);

export const MessageCircle = (props) => wrap(
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
    props
);

export const User = (props) => wrap(
    <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </>,
    props
);

export const ClipboardList = (props) => wrap(
    <>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="8" y1="8" x2="8" y2="8.01" />
        <line x1="12" y1="8" x2="16" y2="8" />
        <line x1="8" y1="12" x2="8" y2="12.01" />
        <line x1="12" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="8" y2="16.01" />
        <line x1="12" y1="16" x2="16" y2="16" />
    </>,
    props
);

export const LogOut = (props) => wrap(
    <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </>,
    props
);

// ===== New Auth Icons =====

export const Lock = (props) => wrap(
    <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>,
    props
);

export const Eye = (props) => wrap(
    <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </>,
    props
);

export const EyeOff = (props) => wrap(
    <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </>,
    props
);

export const Mail = (props) => wrap(
    <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </>,
    props
);

export const Star = (props) => wrap(
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    { ...props, fill: props?.filled ? (props?.color || 'currentColor') : 'none' }
);

export const StarFilled = (props) => wrap(
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    { ...props, fill: props?.color || 'currentColor' }
);

export const Send = (props) => wrap(
    <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>,
    props
);

export const ImageIcon = (props) => wrap(
    <>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </>,
    props
);

export const Camera = (props) => wrap(
    <>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </>,
    props
);

export const Phone = (props) => wrap(
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
    props
);

export const FileText = (props) => wrap(
    <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </>,
    props
);

export const CheckCircle = (props) => wrap(
    <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </>,
    props
);

export const AlertCircle = (props) => wrap(
    <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </>,
    props
);

// ===== Category Icons =====

export const Smartphone = (props) => wrap(
    <>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
    </>,
    props
);

export const Armchair = (props) => wrap(
    <>
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0z" />
        <path d="M5 18v2" />
        <path d="M19 18v2" />
    </>,
    props
);

export const Shirt = (props) => wrap(
    <>
        <path d="M20.38 3.46l-4.08-1.35a1 1 0 0 0-.79.1l-2.63 1.85a1 1 0 0 1-1.16 0L9.09 2.21a1 1 0 0 0-.79-.1L4.22 3.46a1 1 0 0 0-.66.86l-.2 2.68a1 1 0 0 0 .5.95l2.14 1.2v10.85a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9.15l2.14-1.2a1 1 0 0 0 .5-.95l-.2-2.68a1 1 0 0 0-.66-.86z" />
    </>,
    { ...props, fill: 'none' }
);

export const Car = (props) => wrap(
    <>
        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
        <circle cx="6.5" cy="16.5" r="2.5" />
        <circle cx="16.5" cy="16.5" r="2.5" />
    </>,
    props
);

export const UtensilsCrossed = (props) => wrap(
    <>
        <path d="M16 2v20" />
        <path d="M19 2v6a3 3 0 0 1-3 3" />
        <path d="M2 2v6l3 3v11" />
        <path d="M2 8h6" />
        <path d="M2 5h6" />
        <path d="M2 2h6" />
    </>,
    { ...props, fill: 'none' }
);

export const Wrench = (props) => wrap(
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
    props
);

export const Package = (props) => wrap(
    <>
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
    </>,
    props
);

export const Globe = (props) => wrap(
    <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>,
    props
);

export const Clock = (props) => wrap(
    <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </>,
    props
);

export const Target = (props) => wrap(
    <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </>,
    props
);

export const ArrowRight = (props) => wrap(
    <>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </>,
    props
);

export const ArrowLeft = (props) => wrap(
    <>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </>,
    props
);

export const Settings = (props) => wrap(
    <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>,
    props
);

export const Upload = (props) => wrap(
    <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </>,
    props
);

// ===== Category icon map for MapView =====
export const categoryIconMap = {
    electronics: Smartphone,
    furniture: Armchair,
    clothing: Shirt,
    vehicles: Car,
    food: UtensilsCrossed,
    services: Wrench,
    other: Package,
};

const Icon = {
    MapPin, Map, Users, Search, Play, ChevronDown, Plus, X, Edit, Trash,
    ShoppingCart, DollarSign, Tag, MessageCircle, User, ClipboardList, LogOut,
    Lock, Eye, EyeOff, Mail, Star, StarFilled, Send, ImageIcon, Camera, Phone,
    FileText, CheckCircle, AlertCircle, ArrowLeft, Settings, Upload,
    Smartphone, Armchair, Shirt, Car, UtensilsCrossed, Wrench, Package,
    Globe, Clock, Target, ArrowRight, categoryIconMap,
};

export default Icon;
