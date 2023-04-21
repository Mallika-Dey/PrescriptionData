const PrescriptionData = ({ prescription }) => {
    return ( 
    	<> 
    	{
            prescription.map((it) => {
                const { id, pid, name, disease, data } = it;

                return (
                	<tr key={id}>
                		<td>{id}</td>
                		<td>{pid}</td>
                		<td>{name}</td>
                		<td>{disease}</td>
                		<td>{data}</td>
                	</tr>
                )
            })

        } 
        </>
    )
}

export default PrescriptionData;