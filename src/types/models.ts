import type { ReactNode } from "react";

export type ProductColor = {
    id: string;
    className: string;
    value: string;
    defaultChecked?: boolean;
};

export type ProductSizeOption = {
    id: string;
    value: string;
    defaultChecked: boolean;
    status?: string;
};

export type Product = {
    id: number | string;
    productId?: number | string;
    name: string;
    image: string;
    price: string;
    sales?: {
        Weekly: number;
        Monthly: number;
        Yearly: number;
    };
    status?: string;
    quantity?: number | string;
    customer?: string;
    category?: string;
    desc?: string;
    sizeOptions?: {
        id: string;
        value: string;
        defaultChecked: boolean;
        status?: string;
    }[];
    colors?: {
        id: string;
        className: string;
        value: string;
    }[];
    sale?: number;
    stock?: string;
    startDate?: string;
    payment?: number;
};

export type Attribute = {
    id: number;
    category: string;
    value: string;
    group: "TShirt" | "Pants" | "Hat";
    status: "Publish" | "Draft";
    viewHref?: string;
    editHref?: string;
};


export type Category = {
    id: number;
    name: string;
    image: string;
    quantity: number;
    sale: number;
    date: string;
    category: "TShirt" | "Pants" | "Hat";
    status: "Publish" | "Draft";
};

export type MenuChild = { title: string; path: string };

export type MenuItem = {
    key: string;
    title: string;
    icon: string | null;
    iconSvg: ReactNode | null;
    children: MenuChild[];
};

export type MenuSection = {
    heading: string;
    items: MenuItem[];
};

export type PagePostRow = {
    id: number;
    path: string;
    views: string;
    exitRate: string;
    link: string;
};

/** Row shape for the admin user table. */
export type UserItem = {
    id: number;
    name: string;
    avatar: string;
    phone: string;
    email: string;
    role: string;
    status: string;
    note: string;
    viewHref: string;
    editHref: string;
};
