module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/lib/constants.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Thresholds based on Core Web Vitals
__turbopack_context__.s([
    "APP_VERSION",
    ()=>APP_VERSION,
    "ENVIRONMENTS",
    ()=>ENVIRONMENTS,
    "PAGE_TYPES",
    ()=>PAGE_TYPES,
    "SCHEMA_VERSION",
    ()=>SCHEMA_VERSION,
    "STATUS_COLORS",
    ()=>STATUS_COLORS,
    "STATUS_LABELS",
    ()=>STATUS_LABELS,
    "THRESHOLDS",
    ()=>THRESHOLDS
]);
const THRESHOLDS = {
    LCP: {
        good: 2500,
        warn: 4000,
        unit: 'ms',
        name: 'Largest Contentful Paint',
        description: 'Loading performance'
    },
    INP: {
        good: 200,
        warn: 500,
        unit: 'ms',
        name: 'Interaction to Next Paint',
        description: 'Interactivity'
    },
    CLS: {
        good: 0.1,
        warn: 0.25,
        unit: '',
        name: 'Cumulative Layout Shift',
        description: 'Visual stability'
    },
    FCP: {
        good: 1800,
        warn: 3000,
        unit: 'ms',
        name: 'First Contentful Paint',
        description: 'First content appearance'
    },
    TTFB: {
        good: 800,
        warn: 1800,
        unit: 'ms',
        name: 'Time to First Byte',
        description: 'Server response time'
    },
    performance_score: {
        good: 90,
        warn: 50,
        unit: '',
        name: 'Performance Score',
        description: 'Overall performance score'
    }
};
const PAGE_TYPES = [
    {
        value: 'homepage',
        label: 'Homepage'
    },
    {
        value: 'category',
        label: 'Category Page'
    },
    {
        value: 'pdp',
        label: 'Product Detail Page (PDP)'
    },
    {
        value: 'plp',
        label: 'Product Listing Page (PLP)'
    },
    {
        value: 'search',
        label: 'Search Results'
    },
    {
        value: 'custom',
        label: 'Custom Page'
    }
];
const ENVIRONMENTS = [
    {
        value: 'production',
        label: 'Production'
    },
    {
        value: 'staging',
        label: 'Staging'
    },
    {
        value: 'development',
        label: 'Development'
    }
];
const APP_VERSION = '1.0.0';
const SCHEMA_VERSION = '1.0.0';
const STATUS_COLORS = {
    good: 'bg-green-500',
    'needs-improvement': 'bg-yellow-500',
    poor: 'bg-red-500'
};
const STATUS_LABELS = {
    good: 'Good',
    'needs-improvement': 'Needs Improvement',
    poor: 'Poor'
};
}),
"[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateOverallHealth",
    ()=>calculateOverallHealth,
    "classifyMetric",
    ()=>classifyMetric,
    "cn",
    ()=>cn,
    "formatDate",
    ()=>formatDate,
    "formatMetricValue",
    ()=>formatMetricValue,
    "generateId",
    ()=>generateId,
    "getStatusBadgeVariant",
    ()=>getStatusBadgeVariant,
    "getStatusColor",
    ()=>getStatusColor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/lib/constants.ts [app-ssr] (ecmascript)");
;
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function classifyMetric(value, metric) {
    const threshold = __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["THRESHOLDS"][metric];
    if (!threshold) return 'needs-improvement';
    if (value <= threshold.good) return 'good';
    if (value <= threshold.warn) return 'needs-improvement';
    return 'poor';
}
function formatMetricValue(value, metric) {
    // PageSpeed Insights specific display rules
    if (metric === 'LCP' || metric === 'FCP' || metric === 'TTFB') {
        return `${(value / 1000).toFixed(1)} s`;
    }
    if (metric === 'INP') {
        return `${Math.round(value)} ms`;
    }
    if (metric === 'CLS') {
        // PageSpeed uses 2 decimal places usually, or 3 if very small. 2 is cleaner for summary.
        return value.toFixed(2);
    }
    return String(Math.round(value));
}
function generateId() {
    return crypto.randomUUID();
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
function calculateOverallHealth(metrics) {
    if (metrics.length === 0) return 0;
    const scores = {
        good: 100,
        'needs-improvement': 50,
        poor: 0
    };
    const total = metrics.reduce((sum, m)=>sum + scores[m.status], 0);
    return Math.round(total / metrics.length);
}
function getStatusColor(status) {
    const colors = {
        good: 'text-green-600 bg-green-50 border-green-200',
        'needs-improvement': 'text-yellow-600 bg-yellow-50 border-yellow-200',
        poor: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status];
}
function getStatusBadgeVariant(status) {
    switch(status){
        case 'good':
            return 'default';
        case 'needs-improvement':
            return 'secondary';
        case 'poor':
            return 'destructive';
        default:
            return 'default';
    }
}
}),
"[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/ui/tooltip.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tooltip",
    ()=>Tooltip,
    "TooltipContent",
    ()=>TooltipContent,
    "TooltipProvider",
    ()=>TooltipProvider,
    "TooltipTrigger",
    ()=>TooltipTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/@radix-ui/react-tooltip/dist/index.mjs [app-ssr] (ecmascript) <export * as Tooltip>");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function TooltipProvider({ delayDuration = 0, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Provider, {
        "data-slot": "tooltip-provider",
        delayDuration: delayDuration,
        ...props
    }, void 0, false, {
        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/ui/tooltip.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
function Tooltip({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Root, {
        "data-slot": "tooltip",
        ...props
    }, void 0, false, {
        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/ui/tooltip.tsx",
        lineNumber: 24,
        columnNumber: 10
    }, this);
}
function TooltipTrigger({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Trigger, {
        "data-slot": "tooltip-trigger",
        ...props
    }, void 0, false, {
        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/ui/tooltip.tsx",
        lineNumber: 30,
        columnNumber: 10
    }, this);
}
function TooltipContent({ className, sideOffset = 0, children, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Portal, {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Content, {
            "data-slot": "tooltip-content",
            sideOffset: sideOffset,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("z-50 w-fit origin-(--radix-tooltip-content-transform-origin) animate-in rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95", className),
            ...props,
            children: [
                children,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Arrow, {
                    className: "z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground"
                }, void 0, false, {
                    fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/ui/tooltip.tsx",
                    lineNumber: 51,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/ui/tooltip.tsx",
            lineNumber: 41,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/ui/tooltip.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this);
}
;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/ui/button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Slot$3e$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/@radix-ui/react-slot/dist/index.mjs [app-ssr] (ecmascript) <export * as Slot>");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
            outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-9 px-4 py-2 has-[>svg]:px-3",
            xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
            sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
            lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
            icon: "size-9",
            "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
            "icon-sm": "size-8",
            "icon-lg": "size-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Slot$3e$__["Slot"].Root : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        "data-variant": variant,
        "data-size": size,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/ui/button.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Navbar",
    ()=>Navbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/lucide-react/dist/esm/icons/activity.js [app-ssr] (ecmascript) <export default as Activity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/lucide-react/dist/esm/icons/bell.js [app-ssr] (ecmascript) <export default as Bell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/node_modules/lucide-react/dist/esm/icons/user.js [app-ssr] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/ui/button.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
function Navbar() {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const isNavActive = (path)=>{
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        className: "bg-white border-b border-slate-200 sticky top-0 z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between h-16",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-shrink-0 flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"], {
                                        className: "h-6 w-6 text-slate-800"
                                    }, void 0, false, {
                                        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                        lineNumber: 23,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-bold text-xl text-slate-900 tracking-tight",
                                        children: "PerformancePilot"
                                    }, void 0, false, {
                                        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                        lineNumber: 24,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                lineNumber: 22,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "hidden sm:ml-10 sm:flex sm:space-x-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/",
                                        className: `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isNavActive('/') && !isNavActive('/audit') ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`,
                                        children: "Dashboard"
                                    }, void 0, false, {
                                        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                        lineNumber: 29,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/audit",
                                        className: `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isNavActive('/audit') ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`,
                                        children: "New Audit"
                                    }, void 0, false, {
                                        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                        lineNumber: 38,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                lineNumber: 28,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                        lineNumber: 20,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                variant: "ghost",
                                size: "icon",
                                className: "text-slate-500 hover:text-slate-700",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"], {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                    lineNumber: 53,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                lineNumber: 52,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/settings",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "ghost",
                                    size: "icon",
                                    className: "text-slate-500 hover:text-slate-700",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                        className: "h-5 w-5"
                                    }, void 0, false, {
                                        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                        lineNumber: 57,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                    lineNumber: 56,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                lineNumber: 55,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI_Tester_Project$2f$Project8$2d$AI_Performance_Audit_Agent$2f$my$2d$app$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                    className: "h-5 w-5 text-slate-400"
                                }, void 0, false, {
                                    fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                    lineNumber: 61,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                                lineNumber: 60,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                        lineNumber: 51,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
                lineNumber: 19,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
            lineNumber: 18,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/AI_Tester_Project/Project8-AI_Performance_Audit_Agent/my-app/src/components/layout/Navbar.tsx",
        lineNumber: 17,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4934b779._.js.map