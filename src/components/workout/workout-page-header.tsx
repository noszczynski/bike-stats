"use client";

import { Fragment, ReactNode } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

type Crumb = {
    href?: string;
    label: string;
};

type WorkoutPageHeaderProps = {
    title: string;
    description: string;
    actions?: ReactNode;
    breadcrumbs?: Crumb[];
};

export function WorkoutPageHeader({
    title,
    description,
    actions,
    breadcrumbs,
}: WorkoutPageHeaderProps) {
    return (
        <div className="space-y-4">
            {breadcrumbs && breadcrumbs.length > 0 ? (
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                            <Fragment key={`${crumb.label}-${index}`}>
                                <BreadcrumbItem>
                                    {crumb.href ? (
                                        <BreadcrumbLink asChild>
                                            <Link href={crumb.href}>{crumb.label}</Link>
                                        </BreadcrumbLink>
                                    ) : (
                                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                    )}
                                </BreadcrumbItem>
                                {index < breadcrumbs.length - 1 ? <BreadcrumbSeparator /> : null}
                            </Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            ) : null}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                    <p className="text-muted-foreground max-w-2xl text-sm">{description}</p>
                </div>
                {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
        </div>
    );
}
