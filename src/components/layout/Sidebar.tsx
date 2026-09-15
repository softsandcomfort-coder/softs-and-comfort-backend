import Link from "next/link";
import Menu from "./Menu";
import Image from "next/image";

type SidebarProps = {
    handleSidebar: () => void;
};

export default function Sidebar({ handleSidebar }: SidebarProps) {
    return (
        <>
            <div className="overplay-menu d-lg-none" onClick={handleSidebar}></div>
            <div className="section-menu-left">
                <div className="box-logo">
                    <Link href="/" id="site-logo-inner">
                        <Image
                            id="logo_header"
                            alt="Soft & Comfort"
                            src="/images/logo/logo.png"
                            width={154}
                            height={58}
                            data-light="/images/logo/logo.png"
                            data-dark="/images/logo/logo-white.png"
                            priority
                        />
                    </Link>
                    <div className="button-show-hide" onClick={handleSidebar}>
                        <i className="icon-chevron-left" />
                    </div>
                </div>
                <Menu />
            </div>
        </>
    );
}
