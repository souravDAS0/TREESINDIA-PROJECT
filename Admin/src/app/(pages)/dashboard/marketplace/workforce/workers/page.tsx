import { redirect } from "next/navigation";

function page() {
  redirect("/dashboard/workers");
}

export default page;
