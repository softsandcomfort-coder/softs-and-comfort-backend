import Image from "next/image";
import Link from "next/link";

export type TopCustomerRow = {
  id: string | number;
  name: string;
  purchases: number;
  total: string;
  image: string;
};

type TopCustomersProps = {
  /** Real customers, derived from orders. */
  customers?: TopCustomerRow[];
  /** Shown instead of the list when there are genuinely no customers yet. */
  emptyMessage?: string;
};

export default function TopCustomers({ customers: customersProp, emptyMessage }: TopCustomersProps = {}) {
    const customers = customersProp ?? [];


    return (
      <div className="wg-box w-half">
        <div className="flex items-center justify-between">
          <h5>Top Customers</h5>
          <Link href={"/all-user"} className="tf-button-arrow flex items-center gap5">
            <div className="text-tiny text">View all</div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9.83401 4.23423C9.98403 4.08425 10.1875 4 10.3996 4C10.6117 4 10.8152 4.08425 10.9652 4.23423L14.1652 7.43423C14.3152 7.58425 14.3994 7.7877 14.3994 7.99983C14.3994 8.21196 14.3152 8.41541 14.1652 8.56543L10.9652 11.7654C10.8143 11.9112 10.6122 11.9918 10.4025 11.99C10.1927 11.9881 9.99208 11.904 9.84375 11.7557C9.69543 11.6074 9.61129 11.4067 9.60947 11.1969C9.60765 10.9872 9.68828 10.7851 9.83401 10.6342L11.6684 8.79983H2.39961C2.18744 8.79983 1.98395 8.71554 1.83392 8.56551C1.68389 8.41549 1.59961 8.212 1.59961 7.99983C1.59961 7.78766 1.68389 7.58417 1.83392 7.43414C1.98395 7.28411 2.18744 7.19983 2.39961 7.19983H11.6684L9.83401 5.36543C9.68403 5.21541 9.59978 5.01196 9.59978 4.79983C9.59978 4.5877 9.68403 4.38425 9.83401 4.23423Z"
                fill="#FF7433"
              ></path>
            </svg>
          </Link>
        </div>
  
        <div>
          <ul className="flex justify-between gap20 mb-14">
            <li>
              <div className="body-title text-main-dark">Name</div>
            </li>
            <li>
              <div className="body-title text-main-dark">Total money</div>
            </li>
          </ul>
  
          {customers.length === 0 ? (
            <div className="body-text" style={{ padding: "24px 0", textAlign: "center", opacity: 0.7 }}>
              {emptyMessage ?? "No customers yet."}
            </div>
          ) : (
          <ul className="flex flex-column h-full line-top">
            {customers.map((customer) => (
              <li className="wg-product" key={customer.id}>
                <div className="name flex-grow">
                  <div className="image w36 rounded-circle">
                    <Image width={36} height={36} src={customer.image} alt="image" />
                  </div>
                  <div>
                    <div className="title">
                      <a href="#" className="body-text">
                        {customer.name}
                      </a>
                    </div>
                    <div className="purchases text-tiny">
                      {customer.purchases} Purchases
                    </div>
                  </div>
                </div>
                <div className="price body-text">{customer.total}</div>
              </li>
            ))}
          </ul>
          )}
        </div>
      </div>
    );
  }