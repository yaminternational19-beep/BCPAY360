export function useCompanyContext(user) {
  const [activeCompany, setActiveCompany] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("active_company");
    setActiveCompany(saved || user?.company || null);
  }, [user]);

  const switchCompany = (company) => {
    setActiveCompany(company);
    localStorage.setItem("active_company", company);
  };

  const canEdit = (company) =>
    user?.role === "SUPER_ADMIN" || user?.company === company;

  return { activeCompany, switchCompany, canEdit };
}
